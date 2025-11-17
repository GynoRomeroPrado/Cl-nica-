import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseConfig } from '../../config/supabase.config';

@Injectable()
export class BillingService {
  private supabase = SupabaseConfig.getClient();

  async createInvoice(clinicId: string, invoiceData: any) {
    const subtotal = invoiceData.items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unit_price, 0
    );
    const tax = invoiceData.items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unit_price * (item.tax_rate || 0), 0
    );
    const total = subtotal + tax;

    const { data: invoice, error } = await this.supabase
      .from('invoices')
      .insert({
        clinic_id: clinicId,
        patient_id: invoiceData.patient_id,
        appointment_id: invoiceData.appointment_id,
        subtotal, tax, total,
        amount_paid: 0,
        balance: total,
        status: 'pending',
        due_date: invoiceData.due_date || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    const items = invoiceData.items.map((item: any) => ({
      invoice_id: invoice.invoice_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate || 0,
      total: item.quantity * item.unit_price * (1 + (item.tax_rate || 0)),
    }));

    await this.supabase.from('invoice_items').insert(items);
    return this.getInvoiceById(invoice.invoice_id);
  }

  async getInvoiceById(invoiceId: string) {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('*, patient:patient_profiles(*), items:invoice_items(*), payments:payments(*)')
      .eq('invoice_id', invoiceId)
      .single();
    if (error) throw new NotFoundException('Invoice not found');
    return data;
  }

  async getPatientInvoices(patientId: string, filters: any) {
    const { limit = 50, offset = 0 } = filters;
    let query = this.supabase
      .from('invoices')
      .select('*, items:invoice_items(*)', { count: 'exact' })
      .eq('patient_id', patientId)
      .order('invoice_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.startDate) query = query.gte('invoice_date', filters.startDate);
    if (filters.endDate) query = query.lte('invoice_date', filters.endDate);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data, total: count, page: Math.floor(offset / limit) + 1 };
  }

  async recordPayment(invoiceId: string, paymentData: any) {
    const invoice = await this.getInvoiceById(invoiceId);
    if (invoice.status === 'cancelled') throw new BadRequestException('Cannot pay cancelled invoice');
    if (paymentData.amount > invoice.balance) throw new BadRequestException('Amount exceeds balance');

    const { data: payment, error } = await this.supabase
      .from('payments')
      .insert({
        invoice_id: invoiceId,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        payment_status: 'completed',
      })
      .select()
      .single();

    if (error) throw error;

    const newAmountPaid = invoice.amount_paid + paymentData.amount;
    const newBalance = invoice.total - newAmountPaid;
    const newStatus = newBalance === 0 ? 'paid' : 'partial';

    await this.supabase
      .from('invoices')
      .update({ amount_paid: newAmountPaid, balance: newBalance, status: newStatus })
      .eq('invoice_id', invoiceId);

    return payment;
  }

  async getClinicInvoices(clinicId: string, filters: any) {
    const { limit = 50, offset = 0 } = filters;
    let query = this.supabase
      .from('invoices')
      .select('*, patient:patient_profiles(*)', { count: 'exact' })
      .eq('clinic_id', clinicId)
      .order('invoice_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.status) query = query.eq('status', filters.status);
    const { data, error, count } = await query;
    if (error) throw error;

    return { data, total: count };
  }

  async createInsuranceClaim(clinicId: string, claimData: any) {
    const { data, error } = await this.supabase
      .from('insurance_claims')
      .insert({ ...claimData, clinic_id: clinicId, status: 'submitted' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getFinancialSummary(clinicId: string, startDate: string, endDate: string) {
    const { data: invoices } = await this.supabase
      .from('invoices')
      .select('total, amount_paid, status')
      .eq('clinic_id', clinicId)
      .gte('invoice_date', startDate)
      .lte('invoice_date', endDate);

    return {
      total_billed: invoices?.reduce((sum, inv) => sum + inv.total, 0) || 0,
      total_collected: invoices?.reduce((sum, inv) => sum + inv.amount_paid, 0) || 0,
      by_status: {
        pending: invoices?.filter(i => i.status === 'pending').length || 0,
        paid: invoices?.filter(i => i.status === 'paid').length || 0,
      }
    };
  }
}
