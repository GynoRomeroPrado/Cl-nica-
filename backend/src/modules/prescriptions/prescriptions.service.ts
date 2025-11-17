import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseConfig } from '../../config/supabase.config';
import * as crypto from 'crypto';

@Injectable()
export class PrescriptionsService {
  private supabase = SupabaseConfig.getClient();

  /**
   * Get prescriptions for a patient
   */
  async getPatientPrescriptions(
    patientId: string,
    filters: {
      status?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const { status, startDate, endDate, limit = 50, offset = 0 } = filters;

    let query = this.supabase
      .from('prescriptions')
      .select(`
        *,
        patient:patient_profiles!prescriptions_patient_id_fkey(
          mrn,
          user:users!patient_profiles_patient_id_fkey(full_name, phone)
        ),
        prescriber:staff_profiles!prescriptions_prescribed_by_fkey(
          professional_title,
          license_number,
          user:users!staff_profiles_staff_id_fkey(full_name)
        ),
        items:prescription_items(*)
      `, { count: 'exact' })
      .eq('patient_id', patientId)
      .order('prescription_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('prescription_date', startDate);
    }

    if (endDate) {
      query = query.lte('prescription_date', endDate);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data,
      total: count,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get prescription by ID
   */
  async getPrescriptionById(prescriptionId: string) {
    const { data, error } = await this.supabase
      .from('prescriptions')
      .select(`
        *,
        patient:patient_profiles!prescriptions_patient_id_fkey(
          *,
          user:users!patient_profiles_patient_id_fkey(*)
        ),
        prescriber:staff_profiles!prescriptions_prescribed_by_fkey(
          *,
          user:users!staff_profiles_staff_id_fkey(*),
          digital_signature_url
        ),
        appointment:appointments(*),
        medical_record:medical_records(*),
        items:prescription_items(*)
      `)
      .eq('prescription_id', prescriptionId)
      .single();

    if (error) throw new NotFoundException('Prescription not found');

    return data;
  }

  /**
   * Create new prescription
   */
  async createPrescription(
    clinicId: string,
    prescriptionData: any,
    prescriberId: string,
  ) {
    // Validate prescriber has permission (should be done with RBAC)
    const { data: prescriber } = await this.supabase
      .from('staff_profiles')
      .select('license_number, professional_title')
      .eq('staff_id', prescriberId)
      .single();

    if (!prescriber || !prescriber.license_number) {
      throw new BadRequestException('Prescriber must have a valid medical license');
    }

    // Calculate validity (default 30 days if not specified)
    const validUntil = prescriptionData.valid_until ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Generate digital signature
    const signatureData = {
      prescriber_id: prescriberId,
      patient_id: prescriptionData.patient_id,
      timestamp: new Date().toISOString(),
      items: prescriptionData.items,
    };
    const digitalSignature = this.generateDigitalSignature(signatureData);

    // Create prescription
    const { data: prescription, error: prescriptionError } = await this.supabase
      .from('prescriptions')
      .insert({
        clinic_id: clinicId,
        patient_id: prescriptionData.patient_id,
        appointment_id: prescriptionData.appointment_id,
        medical_record_id: prescriptionData.medical_record_id,
        prescribed_by: prescriberId,
        valid_until: validUntil,
        preferred_pharmacy: prescriptionData.preferred_pharmacy,
        notes: prescriptionData.notes,
        digital_signature: digitalSignature,
        signature_timestamp: new Date(),
        status: 'active',
      })
      .select()
      .single();

    if (prescriptionError) throw prescriptionError;

    // Create prescription items
    const itemsToInsert = prescriptionData.items.map((item: any) => ({
      prescription_id: prescription.prescription_id,
      medication_name: item.medication_name,
      generic_name: item.generic_name,
      drug_code: item.drug_code,
      dosage: item.dosage,
      form: item.form,
      route: item.route,
      frequency: item.frequency,
      duration_days: item.duration_days,
      quantity: item.quantity,
      refills: item.refills || 0,
      instructions: item.instructions,
      warnings: item.warnings || [],
    }));

    const { error: itemsError } = await this.supabase
      .from('prescription_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    // Return complete prescription with items
    return this.getPrescriptionById(prescription.prescription_id);
  }

  /**
   * Update prescription status
   */
  async updatePrescriptionStatus(prescriptionId: string, status: string) {
    const validStatuses = ['active', 'dispensed', 'expired', 'cancelled'];

    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid prescription status');
    }

    const { data, error } = await this.supabase
      .from('prescriptions')
      .update({ status })
      .eq('prescription_id', prescriptionId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Cancel prescription
   */
  async cancelPrescription(prescriptionId: string) {
    return this.updatePrescriptionStatus(prescriptionId, 'cancelled');
  }

  /**
   * Record prescription dispensing
   */
  async recordDispensing(prescriptionId: string, dispensingData: any) {
    // Verify prescription is active
    const { data: prescription } = await this.supabase
      .from('prescriptions')
      .select('status')
      .eq('prescription_id', prescriptionId)
      .single();

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.status !== 'active') {
      throw new BadRequestException('Prescription is not active');
    }

    // Record dispensing
    const { data, error } = await this.supabase
      .from('prescription_dispensing')
      .insert({
        prescription_id: prescriptionId,
        pharmacy_name: dispensingData.pharmacy_name,
        pharmacist_name: dispensingData.pharmacist_name,
        quantity_dispensed: dispensingData.quantity_dispensed,
        notes: dispensingData.notes,
      })
      .select()
      .single();

    if (error) throw error;

    // Update prescription status to dispensed
    await this.updatePrescriptionStatus(prescriptionId, 'dispensed');

    return data;
  }

  /**
   * Get prescriptions by doctor
   */
  async getDoctorPrescriptions(
    doctorId: string,
    filters: {
      status?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const { status, startDate, endDate, limit = 50, offset = 0 } = filters;

    let query = this.supabase
      .from('prescriptions')
      .select(`
        *,
        patient:patient_profiles!prescriptions_patient_id_fkey(
          mrn,
          user:users!patient_profiles_patient_id_fkey(full_name)
        ),
        items:prescription_items(medication_name, dosage, frequency, duration_days)
      `, { count: 'exact' })
      .eq('prescribed_by', doctorId)
      .order('prescription_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('prescription_date', startDate);
    }

    if (endDate) {
      query = query.lte('prescription_date', endDate);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data,
      total: count,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get active prescriptions for clinic
   */
  async getActivePrescriptions(clinicId: string, limit = 50) {
    const { data, error } = await this.supabase
      .from('prescriptions')
      .select(`
        *,
        patient:patient_profiles!prescriptions_patient_id_fkey(
          mrn,
          user:users!patient_profiles_patient_id_fkey(full_name)
        ),
        prescriber:staff_profiles!prescriptions_prescribed_by_fkey(
          user:users!staff_profiles_staff_id_fkey(full_name)
        ),
        items:prescription_items(medication_name, dosage)
      `)
      .eq('clinic_id', clinicId)
      .eq('status', 'active')
      .lte('valid_until', new Date().toISOString().split('T')[0])
      .order('prescription_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data;
  }

  /**
   * Get expiring prescriptions (within next 7 days)
   */
  async getExpiringPrescriptions(clinicId: string) {
    const today = new Date();
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data, error } = await this.supabase
      .from('prescriptions')
      .select(`
        *,
        patient:patient_profiles!prescriptions_patient_id_fkey(
          mrn,
          user:users!patient_profiles_patient_id_fkey(full_name, phone, email)
        )
      `)
      .eq('clinic_id', clinicId)
      .eq('status', 'active')
      .gte('valid_until', today.toISOString().split('T')[0])
      .lte('valid_until', sevenDaysLater.toISOString().split('T')[0])
      .order('valid_until', { ascending: true });

    if (error) throw error;

    return data;
  }

  /**
   * Check drug interactions
   * This is a simplified version - in production, integrate with a drug database API
   */
  async checkDrugInteractions(medicationNames: string[]) {
    const interactions = [];

    // Query drug_interactions table for known interactions
    for (let i = 0; i < medicationNames.length; i++) {
      for (let j = i + 1; j < medicationNames.length; j++) {
        const { data } = await this.supabase
          .from('drug_interactions')
          .select('*')
          .or(
            `and(drug_a.ilike.%${medicationNames[i]}%,drug_b.ilike.%${medicationNames[j]}%),` +
            `and(drug_a.ilike.%${medicationNames[j]}%,drug_b.ilike.%${medicationNames[i]}%)`
          );

        if (data && data.length > 0) {
          interactions.push(...data);
        }
      }
    }

    return interactions;
  }

  /**
   * Get prescription statistics
   */
  async getPrescriptionStats(clinicId: string, startDate: string, endDate: string) {
    const { data } = await this.supabase
      .from('prescriptions')
      .select('status, prescription_date')
      .eq('clinic_id', clinicId)
      .gte('prescription_date', startDate)
      .lte('prescription_date', endDate);

    const stats = {
      total: data?.length || 0,
      active: 0,
      dispensed: 0,
      expired: 0,
      cancelled: 0,
    };

    data?.forEach((prescription) => {
      if (prescription.status in stats) {
        stats[prescription.status]++;
      }
    });

    return stats;
  }

  /**
   * Generate digital signature for prescription
   */
  private generateDigitalSignature(data: any): string {
    const secret = process.env.PRESCRIPTION_SIGNATURE_SECRET || 'default-secret-change-in-production';
    const dataString = JSON.stringify(data);
    const signature = crypto
      .createHmac('sha256', secret)
      .update(dataString)
      .digest('hex');

    return signature;
  }

  /**
   * Verify digital signature
   */
  verifyDigitalSignature(data: any, signature: string): boolean {
    const expectedSignature = this.generateDigitalSignature(data);
    return signature === expectedSignature;
  }

  /**
   * Get most prescribed medications
   */
  async getMostPrescribedMedications(clinicId: string, limit = 10) {
    const { data, error } = await this.supabase
      .from('prescription_items')
      .select(`
        medication_name,
        generic_name,
        prescription_id,
        prescriptions!prescription_items_prescription_id_fkey(clinic_id)
      `)
      .eq('prescriptions.clinic_id', clinicId);

    if (error) throw error;

    // Count occurrences
    const medicationCounts = new Map<string, number>();
    data?.forEach((item) => {
      const name = item.medication_name;
      medicationCounts.set(name, (medicationCounts.get(name) || 0) + 1);
    });

    // Sort and return top N
    return Array.from(medicationCounts.entries())
      .map(([name, count]) => ({ medication_name: name, prescription_count: count }))
      .sort((a, b) => b.prescription_count - a.prescription_count)
      .slice(0, limit);
  }
}
