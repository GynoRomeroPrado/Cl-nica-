import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseConfig } from '../../config/supabase.config';

@Injectable()
export class LabOrdersService {
  private supabase = SupabaseConfig.getClient();

  /**
   * Get lab orders for a patient
   */
  async getPatientLabOrders(
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
      .from('lab_orders')
      .select(`
        *,
        patient:patient_profiles!lab_orders_patient_id_fkey(
          mrn,
          user:users!patient_profiles_patient_id_fkey(full_name, date_of_birth)
        ),
        ordered_by_staff:staff_profiles!lab_orders_ordered_by_fkey(
          professional_title,
          user:users!staff_profiles_staff_id_fkey(full_name)
        ),
        test_items:lab_test_items(
          *,
          results:lab_results(*)
        )
      `, { count: 'exact' })
      .eq('patient_id', patientId)
      .order('order_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('order_date', startDate);
    }

    if (endDate) {
      query = query.lte('order_date', endDate);
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
   * Get lab order by ID
   */
  async getLabOrderById(orderId: string) {
    const { data, error } = await this.supabase
      .from('lab_orders')
      .select(`
        *,
        patient:patient_profiles!lab_orders_patient_id_fkey(
          *,
          user:users!patient_profiles_patient_id_fkey(*)
        ),
        ordered_by_staff:staff_profiles!lab_orders_ordered_by_fkey(
          *,
          user:users!staff_profiles_staff_id_fkey(*)
        ),
        appointment:appointments(*),
        test_items:lab_test_items(
          *,
          results:lab_results(*)
        )
      `)
      .eq('order_id', orderId)
      .single();

    if (error) throw new NotFoundException('Lab order not found');

    return data;
  }

  /**
   * Create new lab order
   */
  async createLabOrder(
    clinicId: string,
    orderData: any,
    orderedBy: string,
  ) {
    // Create lab order
    const { data: labOrder, error: orderError } = await this.supabase
      .from('lab_orders')
      .insert({
        clinic_id: clinicId,
        patient_id: orderData.patient_id,
        appointment_id: orderData.appointment_id,
        ordered_by: orderedBy,
        priority: orderData.priority || 'routine',
        lab_name: orderData.lab_name,
        lab_location: orderData.lab_location,
        clinical_indication: orderData.clinical_indication,
        notes: orderData.notes,
        status: 'ordered',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create test items
    const testItemsToInsert = orderData.test_items.map((item: any) => ({
      order_id: labOrder.order_id,
      test_code: item.test_code,
      test_name: item.test_name,
      test_category: item.test_category,
      specimen_type: item.specimen_type,
    }));

    const { error: itemsError } = await this.supabase
      .from('lab_test_items')
      .insert(testItemsToInsert);

    if (itemsError) throw itemsError;

    // Return complete order with items
    return this.getLabOrderById(labOrder.order_id);
  }

  /**
   * Update lab order status
   */
  async updateLabOrderStatus(orderId: string, status: string, additionalData?: any) {
    const validStatuses = ['ordered', 'collected', 'in_progress', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid lab order status');
    }

    const updateData: any = { status };

    // Add timestamp fields based on status
    if (status === 'collected' && additionalData?.specimen_collected_by) {
      updateData.specimen_collected_at = new Date();
      updateData.specimen_collected_by = additionalData.specimen_collected_by;
    }

    if (status === 'completed') {
      updateData.results_available_at = new Date();
    }

    const { data, error } = await this.supabase
      .from('lab_orders')
      .update(updateData)
      .eq('order_id', orderId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Add lab results to test item
   */
  async addLabResult(testItemId: string, resultData: any, verifiedBy?: string) {
    const { data, error } = await this.supabase
      .from('lab_results')
      .insert({
        test_item_id: testItemId,
        result_value: resultData.result_value,
        result_unit: resultData.result_unit,
        reference_range: resultData.reference_range,
        abnormal_flag: resultData.abnormal_flag || 'normal',
        result_status: resultData.result_status || 'preliminary',
        performed_by: resultData.performed_by,
        performed_at: resultData.performed_at || new Date(),
        verified_by: verifiedBy,
        verified_at: verifiedBy ? new Date() : null,
        notes: resultData.notes,
      })
      .select()
      .single();

    if (error) throw error;

    // If result is critical, send alert (to be implemented)
    if (resultData.abnormal_flag === 'critical') {
      // await this.sendCriticalResultAlert(testItemId);
    }

    return data;
  }

  /**
   * Update lab result
   */
  async updateLabResult(resultId: string, updates: any) {
    const { data, error } = await this.supabase
      .from('lab_results')
      .update(updates)
      .eq('result_id', resultId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Verify lab result (final approval)
   */
  async verifyLabResult(resultId: string, verifiedBy: string) {
    const { data, error } = await this.supabase
      .from('lab_results')
      .update({
        result_status: 'final',
        verified_by: verifiedBy,
        verified_at: new Date(),
      })
      .eq('result_id', resultId)
      .select()
      .single();

    if (error) throw error;

    // Update parent lab order status to completed if all results are final
    const { data: testItem } = await this.supabase
      .from('lab_test_items')
      .select('order_id')
      .eq('test_item_id', data.test_item_id)
      .single();

    if (testItem) {
      await this.checkAndUpdateOrderCompletion(testItem.order_id);
    }

    return data;
  }

  /**
   * Check if all tests in order have results and update order status
   */
  private async checkAndUpdateOrderCompletion(orderId: string) {
    const { data: testItems } = await this.supabase
      .from('lab_test_items')
      .select(`
        test_item_id,
        results:lab_results(result_status)
      `)
      .eq('order_id', orderId);

    if (!testItems || testItems.length === 0) return;

    // Check if all test items have final results
    const allFinal = testItems.every((item: any) =>
      item.results && item.results.length > 0 &&
      item.results.some((r: any) => r.result_status === 'final')
    );

    if (allFinal) {
      await this.updateLabOrderStatus(orderId, 'completed');
    }
  }

  /**
   * Get pending lab orders (not yet collected)
   */
  async getPendingLabOrders(clinicId: string, limit = 50) {
    const { data, error } = await this.supabase
      .from('lab_orders')
      .select(`
        *,
        patient:patient_profiles!lab_orders_patient_id_fkey(
          mrn,
          user:users!patient_profiles_patient_id_fkey(full_name, phone)
        ),
        test_items:lab_test_items(test_name, test_category)
      `)
      .eq('clinic_id', clinicId)
      .in('status', ['ordered', 'collected'])
      .order('order_date', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return data;
  }

  /**
   * Get critical lab results (need immediate attention)
   */
  async getCriticalResults(clinicId: string) {
    const { data, error } = await this.supabase
      .from('lab_results')
      .select(`
        *,
        test_item:lab_test_items!lab_results_test_item_id_fkey(
          *,
          lab_order:lab_orders!lab_test_items_order_id_fkey(
            *,
            patient:patient_profiles!lab_orders_patient_id_fkey(
              mrn,
              user:users!patient_profiles_patient_id_fkey(full_name, phone)
            )
          )
        )
      `)
      .eq('abnormal_flag', 'critical')
      .eq('test_item.lab_order.clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data;
  }

  /**
   * Get lab orders by doctor
   */
  async getDoctorLabOrders(
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
      .from('lab_orders')
      .select(`
        *,
        patient:patient_profiles!lab_orders_patient_id_fkey(
          mrn,
          user:users!patient_profiles_patient_id_fkey(full_name)
        ),
        test_items:lab_test_items(test_name, test_category)
      `, { count: 'exact' })
      .eq('ordered_by', doctorId)
      .order('order_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('order_date', startDate);
    }

    if (endDate) {
      query = query.lte('order_date', endDate);
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
   * Get lab order statistics
   */
  async getLabOrderStats(clinicId: string, startDate: string, endDate: string) {
    const { data } = await this.supabase
      .from('lab_orders')
      .select('status, priority, order_date')
      .eq('clinic_id', clinicId)
      .gte('order_date', startDate)
      .lte('order_date', endDate);

    const stats = {
      total: data?.length || 0,
      byStatus: {
        ordered: 0,
        collected: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
      },
      byPriority: {
        stat: 0,
        urgent: 0,
        routine: 0,
      },
    };

    data?.forEach((order) => {
      if (order.status in stats.byStatus) {
        stats.byStatus[order.status]++;
      }
      if (order.priority in stats.byPriority) {
        stats.byPriority[order.priority]++;
      }
    });

    return stats;
  }

  /**
   * Get most ordered lab tests
   */
  async getMostOrderedTests(clinicId: string, limit = 10) {
    const { data, error } = await this.supabase
      .from('lab_test_items')
      .select(`
        test_name,
        test_category,
        order_id,
        lab_orders!lab_test_items_order_id_fkey(clinic_id)
      `)
      .eq('lab_orders.clinic_id', clinicId);

    if (error) throw error;

    // Count occurrences
    const testCounts = new Map<string, { category: string; count: number }>();

    data?.forEach((item) => {
      const existing = testCounts.get(item.test_name);
      if (existing) {
        existing.count++;
      } else {
        testCounts.set(item.test_name, {
          category: item.test_category,
          count: 1,
        });
      }
    });

    // Sort and return top N
    return Array.from(testCounts.entries())
      .map(([name, data]) => ({
        test_name: name,
        test_category: data.category,
        order_count: data.count,
      }))
      .sort((a, b) => b.order_count - a.order_count)
      .slice(0, limit);
  }

  /**
   * Cancel lab order
   */
  async cancelLabOrder(orderId: string) {
    return this.updateLabOrderStatus(orderId, 'cancelled');
  }
}
