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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MedicalRecordsService } from './medical-records.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('medical-records')
@Controller('medical-records')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get medical records for a patient' })
  @ApiQuery({ name: 'recordType', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'providerId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getPatientRecords(
    @Param('patientId') patientId: string,
    @Query() filters: any,
  ) {
    return this.medicalRecordsService.getPatientMedicalRecords(patientId, filters);
  }

  @Get('patient/:patientId/summary')
  @ApiOperation({ summary: 'Generate patient medical summary' })
  async getPatientSummary(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.generatePatientSummary(patientId);
  }

  @Get('patient/:patientId/vitals')
  @ApiOperation({ summary: 'Get vital signs history' })
  async getVitalSigns(
    @Param('patientId') patientId: string,
    @Query('limit') limit = 20,
  ) {
    return this.medicalRecordsService.getVitalSignsHistory(patientId, limit);
  }

  @Get('patient/:patientId/diagnoses')
  @ApiOperation({ summary: 'Get diagnosis history' })
  async getDiagnoses(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.getDiagnosisHistory(patientId);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent medical records for clinic' })
  async getRecentRecords(@Request() req, @Query('limit') limit = 10) {
    return this.medicalRecordsService.getRecentRecords(req.user.clinicId, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get medical records statistics' })
  async getStats(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.medicalRecordsService.getMedicalRecordsStats(
      req.user.clinicId,
      startDate,
      endDate,
    );
  }

  @Get('search/diagnosis/:icd10')
  @ApiOperation({ summary: 'Search records by ICD-10 diagnosis code' })
  async searchByDiagnosis(@Request() req, @Param('icd10') icd10: string) {
    return this.medicalRecordsService.searchByDiagnosis(req.user.clinicId, icd10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get medical record by ID' })
  async getRecord(@Param('id') id: string) {
    return this.medicalRecordsService.getMedicalRecordById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new medical record' })
  async createRecord(@Request() req, @Body() recordData: any) {
    return this.medicalRecordsService.createMedicalRecord(
      req.user.clinicId,
      recordData,
      req.user.id,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update medical record' })
  async updateRecord(
    @Param('id') id: string,
    @Body() updates: any,
    @Request() req,
  ) {
    return this.medicalRecordsService.updateMedicalRecord(id, updates, req.user.id);
  }

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Add attachment to medical record' })
  async addAttachment(@Param('id') id: string, @Body() attachment: any) {
    return this.medicalRecordsService.addAttachment(id, attachment);
  }
}
