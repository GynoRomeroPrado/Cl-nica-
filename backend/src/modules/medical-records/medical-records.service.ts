import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseConfig } from '../../config/supabase.config';

@Injectable()
export class MedicalRecordsService {
  private supabase = SupabaseConfig.getClient();

  /**
   * Get medical records for a patient
   */
  async getPatientMedicalRecords(
    patientId: string,
    filters: {
      recordType?: string;
      startDate?: string;
      endDate?: string;
      providerId?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const { recordType, startDate, endDate, providerId, limit = 50, offset = 0 } = filters;

    let query = this.supabase
      .from('medical_records')
      .select(`
        *,
        patient:patient_profiles!medical_records_patient_id_fkey(
          mrn,
          user:users!patient_profiles_patient_id_fkey(full_name, date_of_birth)
        ),
        provider:staff_profiles!medical_records_provider_id_fkey(
          professional_title,
          specialties,
          user:users!staff_profiles_staff_id_fkey(full_name)
        ),
        appointment:appointments(appointment_date, start_time, appointment_type)
      `, { count: 'exact' })
      .eq('patient_id', patientId)
      .order('record_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (recordType) {
      query = query.eq('record_type', recordType);
    }

    if (startDate) {
      query = query.gte('record_date', startDate);
    }

    if (endDate) {
      query = query.lte('record_date', endDate);
    }

    if (providerId) {
      query = query.eq('provider_id', providerId);
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
   * Get medical record by ID
   */
  async getMedicalRecordById(recordId: string) {
    const { data, error } = await this.supabase
      .from('medical_records')
      .select(`
        *,
        patient:patient_profiles!medical_records_patient_id_fkey(
          *,
          user:users!patient_profiles_patient_id_fkey(*)
        ),
        provider:staff_profiles!medical_records_provider_id_fkey(
          *,
          user:users!staff_profiles_staff_id_fkey(*)
        ),
        appointment:appointments(*)
      `)
      .eq('record_id', recordId)
      .single();

    if (error) throw new NotFoundException('Medical record not found');

    return data;
  }

  /**
   * Create new medical record (consultation note)
   */
  async createMedicalRecord(clinicId: string, recordData: any, providerId: string) {
    // Calculate BMI if height and weight are provided
    let bmi = null;
    if (recordData.height_cm && recordData.weight_kg) {
      bmi = recordData.weight_kg / Math.pow(recordData.height_cm / 100, 2);
    }

    const { data, error } = await this.supabase
      .from('medical_records')
      .insert({
        clinic_id: clinicId,
        patient_id: recordData.patient_id,
        appointment_id: recordData.appointment_id,
        record_type: recordData.record_type || 'consultation',

        // Chief Complaint
        chief_complaint: recordData.chief_complaint,

        // Vital Signs
        temperature_celsius: recordData.temperature_celsius,
        blood_pressure_systolic: recordData.blood_pressure_systolic,
        blood_pressure_diastolic: recordData.blood_pressure_diastolic,
        heart_rate: recordData.heart_rate,
        respiratory_rate: recordData.respiratory_rate,
        oxygen_saturation: recordData.oxygen_saturation,
        weight_kg: recordData.weight_kg,
        height_cm: recordData.height_cm,
        // BMI is auto-calculated by database

        // SOAP Notes
        subjective: recordData.subjective,
        objective: recordData.objective,
        assessment: recordData.assessment,
        plan: recordData.plan,

        // Diagnoses (ICD-10 codes)
        diagnoses: recordData.diagnoses || [],

        // Treatment
        treatment_provided: recordData.treatment_provided,

        // Follow-up
        follow_up_required: recordData.follow_up_required || false,
        follow_up_date: recordData.follow_up_date,
        follow_up_notes: recordData.follow_up_notes,

        // Provider
        provider_id: providerId,
        provider_signature: recordData.provider_signature,

        // Attachments
        attachments: recordData.attachments || [],
      })
      .select()
      .single();

    if (error) throw error;

    // Update patient's last visit date
    await this.supabase
      .from('patient_profiles')
      .update({ last_visit_date: new Date().toISOString().split('T')[0] })
      .eq('patient_id', recordData.patient_id);

    return data;
  }

  /**
   * Update medical record
   */
  async updateMedicalRecord(recordId: string, updates: any, providerId: string) {
    // Verify the record belongs to the provider or user has permission
    const { data: existingRecord } = await this.supabase
      .from('medical_records')
      .select('provider_id')
      .eq('record_id', recordId)
      .single();

    if (!existingRecord) {
      throw new NotFoundException('Medical record not found');
    }

    // Only the original provider can update (or admin - to be implemented with RBAC)
    if (existingRecord.provider_id !== providerId) {
      throw new ForbiddenException('You can only update your own medical records');
    }

    const { data, error } = await this.supabase
      .from('medical_records')
      .update(updates)
      .eq('record_id', recordId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Add attachment to medical record
   */
  async addAttachment(recordId: string, attachment: any) {
    // Get current attachments
    const { data: record } = await this.supabase
      .from('medical_records')
      .select('attachments')
      .eq('record_id', recordId)
      .single();

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    const currentAttachments = record.attachments || [];
    const newAttachments = [...currentAttachments, attachment];

    const { data, error } = await this.supabase
      .from('medical_records')
      .update({ attachments: newAttachments })
      .eq('record_id', recordId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Get vital signs history for a patient
   */
  async getVitalSignsHistory(patientId: string, limit = 20) {
    const { data, error } = await this.supabase
      .from('medical_records')
      .select(`
        record_id,
        record_date,
        temperature_celsius,
        blood_pressure_systolic,
        blood_pressure_diastolic,
        heart_rate,
        respiratory_rate,
        oxygen_saturation,
        weight_kg,
        height_cm,
        bmi
      `)
      .eq('patient_id', patientId)
      .not('temperature_celsius', 'is', null)
      .order('record_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data;
  }

  /**
   * Get diagnosis history for a patient
   */
  async getDiagnosisHistory(patientId: string) {
    const { data, error } = await this.supabase
      .from('medical_records')
      .select(`
        record_id,
        record_date,
        diagnoses,
        assessment,
        provider:staff_profiles!medical_records_provider_id_fkey(
          user:users!staff_profiles_staff_id_fkey(full_name)
        )
      `)
      .eq('patient_id', patientId)
      .not('diagnoses', 'is', null)
      .order('record_date', { ascending: false });

    if (error) throw error;

    // Flatten diagnoses for easier viewing
    const diagnosisHistory = [];
    data?.forEach((record) => {
      record.diagnoses?.forEach((diagnosis: any) => {
        diagnosisHistory.push({
          record_id: record.record_id,
          record_date: record.record_date,
          icd10_code: diagnosis.icd10,
          description: diagnosis.description,
          type: diagnosis.type,
          provider_name: record.provider?.user?.full_name,
        });
      });
    });

    return diagnosisHistory;
  }

  /**
   * Get recent medical records (dashboard)
   */
  async getRecentRecords(clinicId: string, limit = 10) {
    const { data, error } = await this.supabase
      .from('medical_records')
      .select(`
        record_id,
        record_date,
        record_type,
        chief_complaint,
        patient:patient_profiles!medical_records_patient_id_fkey(
          mrn,
          user:users!patient_profiles_patient_id_fkey(full_name)
        ),
        provider:staff_profiles!medical_records_provider_id_fkey(
          user:users!staff_profiles_staff_id_fkey(full_name)
        )
      `)
      .eq('clinic_id', clinicId)
      .order('record_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data;
  }

  /**
   * Search medical records by diagnosis (ICD-10 code)
   */
  async searchByDiagnosis(clinicId: string, icd10Code: string) {
    const { data, error } = await this.supabase
      .from('medical_records')
      .select(`
        *,
        patient:patient_profiles!medical_records_patient_id_fkey(
          mrn,
          user:users!patient_profiles_patient_id_fkey(full_name)
        )
      `)
      .eq('clinic_id', clinicId)
      .contains('diagnoses', [{ icd10: icd10Code }])
      .order('record_date', { ascending: false });

    if (error) throw error;

    return data;
  }

  /**
   * Get statistics for medical records
   */
  async getMedicalRecordsStats(clinicId: string, startDate: string, endDate: string) {
    const { data } = await this.supabase
      .from('medical_records')
      .select('record_type, diagnoses')
      .eq('clinic_id', clinicId)
      .gte('record_date', startDate)
      .lte('record_date', endDate);

    const stats = {
      totalRecords: data?.length || 0,
      byType: {
        consultation: 0,
        procedure: 0,
        emergency: 0,
        lab_result: 0,
      },
      topDiagnoses: new Map<string, number>(),
    };

    data?.forEach((record) => {
      // Count by type
      if (record.record_type in stats.byType) {
        stats.byType[record.record_type]++;
      }

      // Count diagnoses
      record.diagnoses?.forEach((diagnosis: any) => {
        const code = diagnosis.icd10;
        stats.topDiagnoses.set(code, (stats.topDiagnoses.get(code) || 0) + 1);
      });
    });

    // Convert top diagnoses to array and sort
    const topDiagnosesArray = Array.from(stats.topDiagnoses.entries())
      .map(([code, count]) => ({ icd10_code: code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      ...stats,
      topDiagnoses: topDiagnosesArray,
    };
  }

  /**
   * Generate medical summary for patient
   */
  async generatePatientSummary(patientId: string) {
    // Get patient info
    const { data: patient } = await this.supabase
      .from('patient_profiles')
      .select(`
        *,
        user:users!patient_profiles_patient_id_fkey(*)
      `)
      .eq('patient_id', patientId)
      .single();

    // Get recent medical records
    const { data: recentRecords } = await this.supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('record_date', { ascending: false })
      .limit(5);

    // Get active diagnoses (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: recentDiagnoses } = await this.supabase
      .from('medical_records')
      .select('diagnoses, record_date')
      .eq('patient_id', patientId)
      .gte('record_date', sixMonthsAgo.toISOString())
      .not('diagnoses', 'is', null);

    // Flatten and deduplicate diagnoses
    const activeDiagnoses = new Set();
    recentDiagnoses?.forEach((record) => {
      record.diagnoses?.forEach((d: any) => {
        activeDiagnoses.add(`${d.icd10}: ${d.description}`);
      });
    });

    return {
      patient: {
        mrn: patient.mrn,
        name: patient.user.full_name,
        age: this.calculateAge(patient.user.date_of_birth),
        gender: patient.user.gender,
        blood_type: patient.blood_type,
      },
      allergies: patient.allergies || [],
      chronic_conditions: patient.chronic_conditions || [],
      current_medications: patient.current_medications || [],
      active_diagnoses: Array.from(activeDiagnoses),
      recent_visits: recentRecords?.map((r) => ({
        date: r.record_date,
        type: r.record_type,
        chief_complaint: r.chief_complaint,
        assessment: r.assessment,
      })),
      last_visit_date: patient.last_visit_date,
    };
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
}
