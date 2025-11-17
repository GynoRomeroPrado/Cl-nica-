import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LabOrdersService } from './lab-orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, ResourceOwnershipGuard, ClinicIsolationGuard } from '../../common/guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('lab-orders')
@UseGuards(JwtAuthGuard, ClinicIsolationGuard)
export class LabOrdersController {
  constructor(private readonly labOrdersService: LabOrdersService) {}

  @Get('patient/:patientId')
  @UseGuards(ResourceOwnershipGuard)
  async getPatientLabOrders(
    @Param('patientId') patientId: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.labOrdersService.getPatientLabOrders(patientId, {
      status,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get(':orderId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.LAB_TECHNICIAN, UserRole.ADMIN)
  async getLabOrderById(@Param('orderId') orderId: string) {
    return this.labOrdersService.getLabOrderById(orderId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  async createLabOrder(@Request() req, @Body() orderData: any) {
    const clinicId = req.user.clinic_id;
    const orderedBy = req.user.staff_id;
    return this.labOrdersService.createLabOrder(clinicId, orderData, orderedBy);
  }

  @Put(':orderId/status')
  async updateLabOrderStatus(
    @Param('orderId') orderId: string,
    @Body() statusData: { status: string; additional_data?: any },
  ) {
    return this.labOrdersService.updateLabOrderStatus(
      orderId,
      statusData.status,
      statusData.additional_data,
    );
  }

  @Post('test-items/:testItemId/results')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRole.LAB_TECHNICIAN, UserRole.ADMIN)
  async addLabResult(
    @Param('testItemId') testItemId: string,
    @Body() resultData: any,
    @Request() req,
  ) {
    const verifiedBy = req.user.staff_id;
    return this.labOrdersService.addLabResult(testItemId, resultData, verifiedBy);
  }

  @Put('results/:resultId')
  async updateLabResult(
    @Param('resultId') resultId: string,
    @Body() updates: any,
  ) {
    return this.labOrdersService.updateLabResult(resultId, updates);
  }

  @Put('results/:resultId/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  async verifyLabResult(
    @Param('resultId') resultId: string,
    @Request() req,
  ) {
    const verifiedBy = req.user.staff_id;
    return this.labOrdersService.verifyLabResult(resultId, verifiedBy);
  }

  @Get('clinic/pending')
  async getPendingLabOrders(
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    const clinicId = req.user.clinic_id;
    return this.labOrdersService.getPendingLabOrders(
      clinicId,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Get('clinic/critical-results')
  async getCriticalResults(@Request() req) {
    const clinicId = req.user.clinic_id;
    return this.labOrdersService.getCriticalResults(clinicId);
  }

  @Get('doctor/:doctorId')
  async getDoctorLabOrders(
    @Param('doctorId') doctorId: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.labOrdersService.getDoctorLabOrders(doctorId, {
      status,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get('stats/overview')
  async getLabOrderStats(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const clinicId = req.user.clinic_id;
    return this.labOrdersService.getLabOrderStats(clinicId, startDate, endDate);
  }

  @Get('stats/most-ordered')
  async getMostOrderedTests(
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    const clinicId = req.user.clinic_id;
    return this.labOrdersService.getMostOrderedTests(
      clinicId,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Put(':orderId/cancel')
  async cancelLabOrder(@Param('orderId') orderId: string) {
    return this.labOrdersService.cancelLabOrder(orderId);
  }
}
