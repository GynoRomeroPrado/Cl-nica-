import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class AuditLoggingInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const url = request.url;
    const ipAddress = request.ip || request.connection.remoteAddress;
    const userAgent = request.headers['user-agent'];

    const resourceInfo = this.extractResourceInfo(url, method);

    return next.handle().pipe(
      tap(() => {
        if (user && resourceInfo) {
          this.auditService.logAction({
            user_id: user.user_id,
            clinic_id: user.clinic_id,
            action: this.getActionName(method),
            resource_type: resourceInfo.type,
            resource_id: resourceInfo.id,
            ip_address: ipAddress,
            user_agent: userAgent,
            phi_accessed: this.isPHIResource(resourceInfo.type),
            details: { method, url, timestamp: new Date().toISOString() },
          });
        }
      }),
    );
  }

  private extractResourceInfo(url: string, method: string) {
    const patterns = [
      { regex: /\/patients\/([a-f0-9-]+)/i, type: 'patient' },
      { regex: /\/medical-records\/([a-f0-9-]+)/i, type: 'medical_record' },
      { regex: /\/prescriptions\/([a-f0-9-]+)/i, type: 'prescription' },
      { regex: /\/lab-orders\/([a-f0-9-]+)/i, type: 'lab_order' },
      { regex: /\/appointments\/([a-f0-9-]+)/i, type: 'appointment' },
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern.regex);
      if (match) return { type: pattern.type, id: match[1] };
    }

    if (url.includes('/patients')) return { type: 'patient' };
    if (url.includes('/medical-records')) return { type: 'medical_record' };
    if (url.includes('/prescriptions')) return { type: 'prescription' };

    return null;
  }

  private getActionName(method: string): string {
    const actions: any = {
      GET: 'view',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };
    return actions[method] || method.toLowerCase();
  }

  private isPHIResource(resourceType: string): boolean {
    const phiResources = [
      'patient', 'medical_record', 'prescription',
      'lab_order', 'appointment', 'invoice',
    ];
    return phiResources.includes(resourceType);
  }
}
