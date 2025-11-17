import { Injectable } from '@nestjs/common';
import { SupabaseConfig } from '../../config/supabase.config';

export interface AuditLogEntry {
  user_id: string;
  clinic_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: any;
  phi_accessed?: boolean;
}

@Injectable()
export class AuditService {
  private supabase = SupabaseConfig.getClient();

  async logAction(entry: AuditLogEntry) {
    const { error } = await this.supabase.from('audit_logs').insert({
      user_id: entry.user_id,
      clinic_id: entry.clinic_id,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      details: entry.details,
      phi_accessed: entry.phi_accessed || false,
    });

    if (error) console.error('Audit logging failed:', error);
    return { success: !error };
  }

  async logPHIAccess(
    userId: string, clinicId: string, resourceType: string,
    resourceId: string, action: string, ipAddress?: string, userAgent?: string
  ) {
    return this.logAction({
      user_id: userId, clinic_id: clinicId, action, resource_type: resourceType,
      resource_id: resourceId, ip_address: ipAddress, user_agent: userAgent, phi_accessed: true,
    });
  }

  async getResourceAuditLogs(resourceType: string, resourceId: string, filters?: any) {
    const { startDate, endDate, limit = 100, offset = 0 } = filters || {};

    let query = this.supabase
      .from('audit_logs')
      .select('*, user:users(*)', { count: 'exact' })
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data, total: count };
  }

  async getUserAuditLogs(userId: string, filters?: any) {
    const { action, resourceType, phiOnly, startDate, endDate, limit = 100, offset = 0 } = filters || {};

    let query = this.supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) query = query.eq('action', action);
    if (resourceType) query = query.eq('resource_type', resourceType);
    if (phiOnly) query = query.eq('phi_accessed', true);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data, total: count };
  }

  async getClinicAuditLogs(clinicId: string, filters?: any) {
    const { action, resourceType, userId, phiOnly, startDate, endDate, limit = 100, offset = 0 } = filters || {};

    let query = this.supabase
      .from('audit_logs')
      .select('*, user:users(*)', { count: 'exact' })
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) query = query.eq('action', action);
    if (resourceType) query = query.eq('resource_type', resourceType);
    if (userId) query = query.eq('user_id', userId);
    if (phiOnly) query = query.eq('phi_accessed', true);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data, total: count };
  }

  async getSuspiciousActivity(clinicId: string, timeWindowHours = 24) {
    const startDate = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000).toISOString();

    const { data } = await this.supabase
      .from('audit_logs')
      .select('user_id, user:users(*)')
      .eq('clinic_id', clinicId)
      .eq('phi_accessed', true)
      .gte('created_at', startDate);

    const accessCounts = new Map();
    data?.forEach((log: any) => {
      const existing = accessCounts.get(log.user_id);
      if (existing) {
        existing.count++;
      } else {
        accessCounts.set(log.user_id, { user: log.user, count: 1 });
      }
    });

    return Array.from(accessCounts.entries())
      .filter(([, data]: any) => data.count > 100)
      .map(([userId, data]: any) => ({
        user_id: userId,
        user: data.user,
        phi_access_count: data.count,
        time_window_hours: timeWindowHours,
      }))
      .sort((a, b) => b.phi_access_count - a.phi_access_count);
  }

  async getAuditStats(clinicId: string, startDate: string, endDate: string) {
    const { data: logs } = await this.supabase
      .from('audit_logs')
      .select('action, resource_type, phi_accessed, user_id')
      .eq('clinic_id', clinicId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    return {
      total_actions: logs?.length || 0,
      phi_accesses: logs?.filter(l => l.phi_accessed).length || 0,
      unique_users: new Set(logs?.map(l => l.user_id)).size,
    };
  }

  async exportAuditLogs(clinicId: string, startDate: string, endDate: string, format = 'json') {
    const { data } = await this.supabase
      .from('audit_logs')
      .select('*, user:users(*)')
      .eq('clinic_id', clinicId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (format === 'csv') {
      const headers = ['Timestamp', 'User', 'Action', 'Resource', 'PHI Accessed'];
      const rows = data?.map((log: any) => [
        log.created_at,
        log.user?.full_name || 'Unknown',
        log.action,
        log.resource_type,
        log.phi_accessed ? 'Yes' : 'No',
      ]) || [];
      return { format: 'csv', headers, rows };
    }

    return { format: 'json', data };
  }
}
