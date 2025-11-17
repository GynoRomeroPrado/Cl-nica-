import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseConfig } from '../../config/supabase.config';
import * as crypto from 'crypto';

@Injectable()
export class TelemedicineService {
  private supabase = SupabaseConfig.getClient();

  async createTelemedicineSession(appointmentId: string, providerId: string, options?: any) {
    const sessionId = crypto.randomUUID();
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();

    const { data, error } = await this.supabase
      .from('telemedicine_sessions')
      .insert({
        appointment_id: appointmentId,
        provider_id: providerId,
        session_id: sessionId,
        room_code: roomCode,
        status: 'scheduled',
        duration_minutes: options?.duration_minutes || 30,
        recording_enabled: options?.recording_enabled || false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async startSession(sessionId: string, userId: string) {
    const { data, error } = await this.supabase
      .from('telemedicine_sessions')
      .update({ status: 'in_progress', actual_start: new Date() })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async endSession(sessionId: string, providerId: string, notes?: string) {
    const { data, error } = await this.supabase
      .from('telemedicine_sessions')
      .update({ status: 'completed', actual_end: new Date(), session_notes: notes })
      .eq('session_id', sessionId)
      .eq('provider_id', providerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSessionById(sessionId: string) {
    const { data, error } = await this.supabase
      .from('telemedicine_sessions')
      .select('*, appointment:appointments(*), provider:staff_profiles(*), patient:patient_profiles(*)')
      .eq('session_id', sessionId)
      .single();

    if (error) throw new NotFoundException('Session not found');
    return data;
  }

  async getProviderUpcomingSessions(providerId: string, limit = 10) {
    const { data, error } = await this.supabase
      .from('telemedicine_sessions')
      .select('*, appointment:appointments(*), patient:patient_profiles(*)')
      .eq('provider_id', providerId)
      .in('status', ['scheduled', 'waiting'])
      .order('scheduled_start', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async getPatientSessions(patientId: string, filters?: any) {
    const { limit = 50, offset = 0 } = filters || {};
    let query = this.supabase
      .from('telemedicine_sessions')
      .select('*, provider:staff_profiles(*)', { count: 'exact' })
      .eq('patient_id', patientId)
      .order('scheduled_start', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data, total: count };
  }

  async joinSessionByRoomCode(roomCode: string, userId: string) {
    const { data, error } = await this.supabase
      .from('telemedicine_sessions')
      .select('*')
      .eq('room_code', roomCode)
      .single();

    if (error) throw new NotFoundException('Invalid room code');

    if (data.status === 'scheduled') {
      await this.supabase
        .from('telemedicine_sessions')
        .update({ status: 'waiting' })
        .eq('session_id', data.session_id);
    }

    return this.getSessionById(data.session_id);
  }

  async generateAccessToken(sessionId: string, userId: string, userRole: string) {
    const token = crypto
      .createHmac('sha256', process.env.VIDEO_SECRET || 'default-secret')
      .update(`${sessionId}-${userId}-${userRole}`)
      .digest('hex');

    return { session_id: sessionId, access_token: token, user_role: userRole, expires_in: 3600 };
  }
}
