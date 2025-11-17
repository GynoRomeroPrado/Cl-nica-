import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseConfig } from '../../config/supabase.config';

@Injectable()
export class PatientsService {
  private supabase = SupabaseConfig.getClient();

  /**
   * Get all patients for a clinic with pagination
   */
  async getPatients(clinicId: string, limit = 50, offset = 0, search?: string) {
    let query = this.supabase
      .from('patient_profiles')
      .select(`
        *,
        user:users!patient_profiles_patient_id_fkey(
          full_name,
          email,
          phone,
          date_of_birth,
          gender
        )
      `, { count: 'exact' })
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Search by name, MRN, email
    if (search) {
      query = query.or(`mrn.ilike.%${search}%,user.full_name.ilike.%${search}%,user.email.ilike.%${search}%`);
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
   * Get patient by ID with full details
   */
  async getPatientById(patientId: string) {
    const { data, error } = await this.supabase
      .from('patient_profiles')
      .select(`
        *,
        user:users!patient_profiles_patient_id_fkey(*),
        preferred_doctor:staff_profiles!patient_profiles_preferred_doctor_id_fkey(
          staff_id,
          professional_title,
          user:users!staff_profiles_staff_id_fkey(full_name)
        )
      `)
      .eq('patient_id', patientId)
      .single();

    if (error) throw new NotFoundException('Patient not found');

    return data;
  }

  /**
   * Get patient by MRN (Medical Record Number)
   */
  async getPatientByMRN(mrn: string, clinicId: string) {
    const { data, error } = await this.supabase
      .from('patient_profiles')
      .select(`
        *,
        user:users!patient_profiles_patient_id_fkey(*)
      `)
      .eq('mrn', mrn)
      .eq('clinic_id', clinicId)
      .single();

    if (error) throw new NotFoundException('Patient not found');

    return data;
  }

  /**
   * Create new patient
   */
  async createPatient(clinicId: string, patientData: any) {
    const { data: user, error: userError } = await this.supabase.auth.admin.createUser({
      email: patientData.email,
      password: patientData.password || this.generateTempPassword(),
      email_confirm: true,
      user_metadata: {
        full_name: patientData.full_name,
        user_type: 'patient',
      },
    });

    if (userError) throw userError;

    // Create user record
    const { data: userRecord, error: userRecordError } = await this.supabase
      .from('users')
      .insert({
        user_id: user.user.id,
        clinic_id: clinicId,
        email: patientData.email,
        full_name: patientData.full_name,
        first_name: patientData.first_name,
        last_name: patientData.last_name,
        date_of_birth: patientData.date_of_birth,
        gender: patientData.gender,
        phone: patientData.phone,
        address_line1: patientData.address_line1,
        address_line2: patientData.address_line2,
        city: patientData.city,
        state: patientData.state,
        postal_code: patientData.postal_code,
        country: patientData.country || 'Colombia',
        id_type: patientData.id_type,
        id_number: patientData.id_number,
        emergency_contact_name: patientData.emergency_contact_name,
        emergency_contact_phone: patientData.emergency_contact_phone,
        emergency_contact_relationship: patientData.emergency_contact_relationship,
        user_type: 'patient',
      })
      .select()
      .single();

    if (userRecordError) throw userRecordError;

    // Create patient profile
    const { data: patientProfile, error: patientError } = await this.supabase
      .from('patient_profiles')
      .insert({
        patient_id: user.user.id,
        clinic_id: clinicId,
        blood_type: patientData.blood_type,
        marital_status: patientData.marital_status,
        occupation: patientData.occupation,
        insurance_provider: patientData.insurance_provider,
        insurance_policy_number: patientData.insurance_policy_number,
        insurance_group_number: patientData.insurance_group_number,
        insurance_expiry_date: patientData.insurance_expiry_date,
        allergies: patientData.allergies || [],
        chronic_conditions: patientData.chronic_conditions || [],
        current_medications: patientData.current_medications || [],
        height_cm: patientData.height_cm,
        weight_kg: patientData.weight_kg,
        preferred_doctor_id: patientData.preferred_doctor_id,
        preferred_pharmacy: patientData.preferred_pharmacy,
      })
      .select()
      .single();

    if (patientError) throw patientError;

    return {
      ...patientProfile,
      user: userRecord,
    };
  }

  /**
   * Update patient information
   */
  async updatePatient(patientId: string, updates: any) {
    // Update user table
    if (updates.user) {
      const { error: userError } = await this.supabase
        .from('users')
        .update(updates.user)
        .eq('user_id', patientId);

      if (userError) throw userError;
    }

    // Update patient profile
    if (updates.profile) {
      const { error: profileError } = await this.supabase
        .from('patient_profiles')
        .update(updates.profile)
        .eq('patient_id', patientId);

      if (profileError) throw profileError;
    }

    return this.getPatientById(patientId);
  }

  /**
   * Get patient medical history
   */
  async getPatientHistory(patientId: string, historyType?: string) {
    let query = this.supabase
      .from('patient_history')
      .select('*')
      .eq('patient_id', patientId)
      .order('date_recorded', { ascending: false });

    if (historyType) {
      query = query.eq('history_type', historyType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  }

  /**
   * Add patient history entry (immunization, surgery, allergy, etc.)
   */
  async addHistoryEntry(patientId: string, historyData: any, createdBy: string) {
    const { data, error } = await this.supabase
      .from('patient_history')
      .insert({
        patient_id: patientId,
        history_type: historyData.history_type,
        description: historyData.description,
        date_recorded: historyData.date_recorded || new Date(),
        notes: historyData.notes,
        details: historyData.details,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Get patient documents
   */
  async getPatientDocuments(patientId: string, documentType?: string) {
    let query = this.supabase
      .from('patient_documents')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (documentType) {
      query = query.eq('document_type', documentType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  }

  /**
   * Upload patient document
   */
  async uploadDocument(patientId: string, clinicId: string, documentData: any, uploadedBy: string) {
    const { data, error } = await this.supabase
      .from('patient_documents')
      .insert({
        patient_id: patientId,
        clinic_id: clinicId,
        document_type: documentData.document_type,
        document_name: documentData.document_name,
        description: documentData.description,
        file_url: documentData.file_url,
        file_type: documentData.file_type,
        file_size_bytes: documentData.file_size_bytes,
        document_date: documentData.document_date,
        uploaded_by: uploadedBy,
        is_encrypted: documentData.is_encrypted || false,
        tags: documentData.tags || [],
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Get patient statistics
   */
  async getPatientStats(patientId: string) {
    // Get total appointments
    const { count: totalAppointments } = await this.supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId);

    // Get total prescriptions
    const { count: totalPrescriptions } = await this.supabase
      .from('prescriptions')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId);

    // Get total lab orders
    const { count: totalLabOrders } = await this.supabase
      .from('lab_orders')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId);

    // Get last visit
    const { data: lastVisit } = await this.supabase
      .from('appointments')
      .select('appointment_date, start_time')
      .eq('patient_id', patientId)
      .eq('status', 'completed')
      .order('appointment_date', { ascending: false })
      .limit(1)
      .single();

    return {
      totalAppointments,
      totalPrescriptions,
      totalLabOrders,
      lastVisit: lastVisit ? `${lastVisit.appointment_date} ${lastVisit.start_time}` : null,
    };
  }

  /**
   * Generate temporary password for new patient
   */
  private generateTempPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Deactivate patient (soft delete)
   */
  async deactivatePatient(patientId: string) {
    const { error } = await this.supabase
      .from('patient_profiles')
      .update({ patient_status: 'inactive' })
      .eq('patient_id', patientId);

    if (error) throw error;

    return { message: 'Patient deactivated successfully' };
  }
}
