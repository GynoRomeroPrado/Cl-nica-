import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseConfig } from '../../config/supabase.config';

@Injectable()
export class AppointmentsService {
  private supabase = SupabaseConfig.getClient();

  /**
   * Get appointments for a clinic with filters
   */
  async getAppointments(
    clinicId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      doctorId?: string;
      patientId?: string;
      status?: string;
      appointmentType?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const { startDate, endDate, doctorId, patientId, status, appointmentType, limit = 50, offset = 0 } = filters;

    let query = this.supabase
      .from('appointments')
      .select(`
        *,
        patient:patient_profiles!appointments_patient_id_fkey(
          patient_id,
          mrn,
          user:users!patient_profiles_patient_id_fkey(full_name, phone, email)
        ),
        doctor:staff_profiles!appointments_doctor_id_fkey(
          staff_id,
          professional_title,
          specialties,
          user:users!staff_profiles_staff_id_fkey(full_name)
        ),
        location:clinic_locations(location_name, address_line1, city)
      `, { count: 'exact' })
      .eq('clinic_id', clinicId)
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })
      .range(offset, offset + limit - 1);

    if (startDate) {
      query = query.gte('appointment_date', startDate);
    }

    if (endDate) {
      query = query.lte('appointment_date', endDate);
    }

    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (appointmentType) {
      query = query.eq('appointment_type', appointmentType);
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
   * Get appointment by ID
   */
  async getAppointmentById(appointmentId: string) {
    const { data, error } = await this.supabase
      .from('appointments')
      .select(`
        *,
        patient:patient_profiles!appointments_patient_id_fkey(
          *,
          user:users!patient_profiles_patient_id_fkey(*)
        ),
        doctor:staff_profiles!appointments_doctor_id_fkey(
          *,
          user:users!staff_profiles_staff_id_fkey(*)
        ),
        location:clinic_locations(*)
      `)
      .eq('appointment_id', appointmentId)
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Create new appointment
   */
  async createAppointment(clinicId: string, appointmentData: any) {
    // Validate time slot availability
    const isAvailable = await this.checkTimeSlotAvailability(
      appointmentData.doctor_id,
      appointmentData.appointment_date,
      appointmentData.start_time,
      appointmentData.end_time,
    );

    if (!isAvailable) {
      throw new BadRequestException('Time slot is not available');
    }

    const { data, error } = await this.supabase
      .from('appointments')
      .insert({
        clinic_id: clinicId,
        location_id: appointmentData.location_id,
        patient_id: appointmentData.patient_id,
        doctor_id: appointmentData.doctor_id,
        appointment_date: appointmentData.appointment_date,
        start_time: appointmentData.start_time,
        end_time: appointmentData.end_time,
        duration_minutes: appointmentData.duration_minutes || 30,
        appointment_type: appointmentData.appointment_type || 'consultation',
        reason_for_visit: appointmentData.reason_for_visit,
        department: appointmentData.department,
        notes: appointmentData.notes,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;

    // Send reminder notification
    // await this.sendAppointmentReminder(data.appointment_id);

    return data;
  }

  /**
   * Update appointment
   */
  async updateAppointment(appointmentId: string, updates: any) {
    const { data, error } = await this.supabase
      .from('appointments')
      .update(updates)
      .eq('appointment_id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId: string, cancellationData: any, cancelledBy: string) {
    const { data, error } = await this.supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date(),
        cancelled_by: cancelledBy,
        cancellation_reason: cancellationData.reason,
      })
      .eq('appointment_id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Check-in patient
   */
  async checkInPatient(appointmentId: string, checkedInBy: string) {
    const { data, error } = await this.supabase
      .from('appointments')
      .update({
        status: 'checked_in',
        checked_in_at: new Date(),
        checked_in_by: checkedInBy,
      })
      .eq('appointment_id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Start appointment (doctor begins consultation)
   */
  async startAppointment(appointmentId: string) {
    const { data, error } = await this.supabase
      .from('appointments')
      .update({ status: 'in_progress' })
      .eq('appointment_id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Complete appointment
   */
  async completeAppointment(appointmentId: string) {
    const { data, error } = await this.supabase
      .from('appointments')
      .update({
        status: 'completed',
        completed_at: new Date(),
      })
      .eq('appointment_id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Get doctor availability for a specific date
   */
  async getDoctorAvailability(doctorId: string, date: string) {
    // Get doctor's working hours for the day
    const { data: doctor } = await this.supabase
      .from('staff_profiles')
      .select('working_hours')
      .eq('staff_id', doctorId)
      .single();

    if (!doctor || !doctor.working_hours) {
      return { available: false, slots: [] };
    }

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
    const workingHours = doctor.working_hours[dayOfWeek];

    if (!workingHours || workingHours.length === 0) {
      return { available: false, slots: [] };
    }

    // Get existing appointments for the day
    const { data: appointments } = await this.supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .in('status', ['scheduled', 'confirmed', 'checked_in', 'in_progress']);

    // Generate available time slots
    const availableSlots = this.generateTimeSlots(workingHours, appointments || []);

    return {
      available: availableSlots.length > 0,
      slots: availableSlots,
    };
  }

  /**
   * Check if a time slot is available
   */
  private async checkTimeSlotAvailability(
    doctorId: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('appointments')
      .select('appointment_id')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .in('status', ['scheduled', 'confirmed', 'checked_in', 'in_progress'])
      .or(`start_time.lte.${startTime},end_time.gte.${endTime}`)
      .or(`start_time.gte.${startTime},start_time.lt.${endTime}`)
      .or(`end_time.gt.${startTime},end_time.lte.${endTime}`);

    if (error) throw error;

    return data.length === 0;
  }

  /**
   * Generate available time slots
   */
  private generateTimeSlots(workingHours: any[], bookedSlots: any[]): string[] {
    const slots: string[] = [];
    const slotDuration = 30; // minutes

    workingHours.forEach((period) => {
      let currentTime = this.parseTime(period.start);
      const endTime = this.parseTime(period.end);

      while (currentTime < endTime) {
        const slotStart = this.formatTime(currentTime);
        const slotEnd = this.formatTime(currentTime + slotDuration);

        // Check if slot is not booked
        const isBooked = bookedSlots.some((booked) => {
          const bookedStart = this.parseTime(booked.start_time);
          const bookedEnd = this.parseTime(booked.end_time);
          return currentTime < bookedEnd && (currentTime + slotDuration) > bookedStart;
        });

        if (!isBooked) {
          slots.push(`${slotStart} - ${slotEnd}`);
        }

        currentTime += slotDuration;
      }
    });

    return slots;
  }

  /**
   * Parse time string (HH:MM) to minutes
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Format minutes to time string (HH:MM)
   */
  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(clinicId: string, limit = 20) {
    const { data, error } = await this.supabase
      .from('appointments')
      .select(`
        *,
        patient:patient_profiles!appointments_patient_id_fkey(
          mrn,
          user:users!patient_profiles_patient_id_fkey(full_name, phone)
        ),
        doctor:staff_profiles!appointments_doctor_id_fkey(
          professional_title,
          user:users!staff_profiles_staff_id_fkey(full_name)
        )
      `)
      .eq('clinic_id', clinicId)
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .in('status', ['scheduled', 'confirmed'])
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return data;
  }

  /**
   * Get appointment statistics for a clinic
   */
  async getAppointmentStats(clinicId: string, startDate: string, endDate: string) {
    const { data } = await this.supabase
      .from('appointments')
      .select('status')
      .eq('clinic_id', clinicId)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate);

    const stats = {
      total: data?.length || 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      completionRate: 0,
      noShowRate: 0,
    };

    data?.forEach((appointment) => {
      switch (appointment.status) {
        case 'scheduled':
        case 'confirmed':
          stats.scheduled++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
        case 'no_show':
          stats.noShow++;
          break;
      }
    });

    if (stats.total > 0) {
      stats.completionRate = Math.round((stats.completed / stats.total) * 100);
      stats.noShowRate = Math.round((stats.noShow / stats.total) * 100);
    }

    return stats;
  }
}
