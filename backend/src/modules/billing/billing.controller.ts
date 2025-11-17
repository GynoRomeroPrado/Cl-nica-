import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, ResourceOwnershipGuard, ClinicIsolationGuard } from '../../common/guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('billing')
@UseGuards(JwtAuthGuard, ClinicIsolationGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoices')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async createInvoice(@Request() req, @Body() invoiceData: any) {
    return this.billingService.createInvoice(req.user.clinic_id, invoiceData);
  }

  @Get('invoices/:invoiceId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR)
  async getInvoiceById(@Param('invoiceId') invoiceId: string) {
    return this.billingService.getInvoiceById(invoiceId);
  }

  @Get('patient/:patientId/invoices')
  @UseGuards(ResourceOwnershipGuard)
  async getPatientInvoices(@Param('patientId') patientId: string, @Query() filters: any) {
    return this.billingService.getPatientInvoices(patientId, filters);
  }

  @Post('invoices/:invoiceId/payments')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async recordPayment(@Param('invoiceId') invoiceId: string, @Body() paymentData: any) {
    return this.billingService.recordPayment(invoiceId, paymentData);
  }

  @Get('invoices')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async getClinicInvoices(@Request() req, @Query() filters: any) {
    return this.billingService.getClinicInvoices(req.user.clinic_id, filters);
  }

  @Post('insurance-claims')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async createInsuranceClaim(@Request() req, @Body() claimData: any) {
    return this.billingService.createInsuranceClaim(req.user.clinic_id, claimData);
  }

  @Get('reports/financial-summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getFinancialSummary(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.billingService.getFinancialSummary(req.user.clinic_id, startDate, endDate);
  }
}
