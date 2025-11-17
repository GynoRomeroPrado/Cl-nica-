import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('prescriptions')
@Controller('prescriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get prescriptions for a patient' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getPatientPrescriptions(
    @Param('patientId') patientId: string,
    @Query() filters: any,
  ) {
    return this.prescriptionsService.getPatientPrescriptions(patientId, filters);
  }

  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Get prescriptions by doctor' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getDoctorPrescriptions(
    @Param('doctorId') doctorId: string,
    @Query() filters: any,
  ) {
    return this.prescriptionsService.getDoctorPrescriptions(doctorId, filters);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active prescriptions for clinic' })
  async getActivePrescriptions(@Request() req, @Query('limit') limit = 50) {
    return this.prescriptionsService.getActivePrescriptions(req.user.clinicId, limit);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get prescriptions expiring within 7 days' })
  async getExpiringPrescriptions(@Request() req) {
    return this.prescriptionsService.getExpiringPrescriptions(req.user.clinicId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get prescription statistics' })
  async getStats(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.prescriptionsService.getPrescriptionStats(
      req.user.clinicId,
      startDate,
      endDate,
    );
  }

  @Get('top-medications')
  @ApiOperation({ summary: 'Get most prescribed medications' })
  async getTopMedications(@Request() req, @Query('limit') limit = 10) {
    return this.prescriptionsService.getMostPrescribedMedications(
      req.user.clinicId,
      limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prescription by ID' })
  async getPrescription(@Param('id') id: string) {
    return this.prescriptionsService.getPrescriptionById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new prescription' })
  async createPrescription(@Request() req, @Body() prescriptionData: any) {
    return this.prescriptionsService.createPrescription(
      req.user.clinicId,
      prescriptionData,
      req.user.id,
    );
  }

  @Post('check-interactions')
  @ApiOperation({ summary: 'Check drug interactions' })
  async checkInteractions(@Body() data: { medications: string[] }) {
    return this.prescriptionsService.checkDrugInteractions(data.medications);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update prescription status' })
  async updateStatus(@Param('id') id: string, @Body() data: { status: string }) {
    return this.prescriptionsService.updatePrescriptionStatus(id, data.status);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel prescription' })
  async cancelPrescription(@Param('id') id: string) {
    return this.prescriptionsService.cancelPrescription(id);
  }

  @Post(':id/dispense')
  @ApiOperation({ summary: 'Record prescription dispensing' })
  async recordDispensing(@Param('id') id: string, @Body() dispensingData: any) {
    return this.prescriptionsService.recordDispensing(id, dispensingData);
  }
}
