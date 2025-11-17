import {
  Controller, Get, Query, Param, UseGuards, Request,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, ClinicIsolationGuard } from '../../common/guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('audit')
@UseGuards(JwtAuthGuard, ClinicIsolationGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('resource/:resourceType/:resourceId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async getResourceAuditLogs(
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
    @Query() filters: any,
  ) {
    return this.auditService.getResourceAuditLogs(resourceType, resourceId, filters);
  }

  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUserAuditLogs(@Param('userId') userId: string, @Query() filters: any) {
    return this.auditService.getUserAuditLogs(userId, filters);
  }

  @Get('clinic')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getClinicAuditLogs(@Request() req, @Query() filters: any) {
    return this.auditService.getClinicAuditLogs(req.user.clinic_id, filters);
  }

  @Get('suspicious')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getSuspiciousActivity(
    @Request() req,
    @Query('timeWindowHours') timeWindowHours?: string,
  ) {
    return this.auditService.getSuspiciousActivity(
      req.user.clinic_id,
      timeWindowHours ? parseInt(timeWindowHours) : undefined,
    );
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAuditStats(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.auditService.getAuditStats(req.user.clinic_id, startDate, endDate);
  }

  @Get('export')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async exportAuditLogs(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format?: string,
  ) {
    return this.auditService.exportAuditLogs(req.user.clinic_id, startDate, endDate, format);
  }
}
