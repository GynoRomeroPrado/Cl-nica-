import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('patients')
@Controller('patients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all patients for clinic' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getPatients(
    @Request() req,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
    @Query('search') search?: string,
  ) {
    const clinicId = req.user.clinicId; // From JWT token
    return this.patientsService.getPatients(clinicId, limit, offset, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  async getPatient(@Param('id') id: string) {
    return this.patientsService.getPatientById(id);
  }

  @Get('mrn/:mrn')
  @ApiOperation({ summary: 'Get patient by Medical Record Number' })
  async getPatientByMRN(@Param('mrn') mrn: string, @Request() req) {
    return this.patientsService.getPatientByMRN(mrn, req.user.clinicId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new patient' })
  async createPatient(@Request() req, @Body() patientData: any) {
    return this.patientsService.createPatient(req.user.clinicId, patientData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update patient information' })
  async updatePatient(@Param('id') id: string, @Body() updates: any) {
    return this.patientsService.updatePatient(id, updates);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get patient medical history' })
  @ApiQuery({ name: 'type', required: false, type: String })
  async getPatientHistory(
    @Param('id') id: string,
    @Query('type') type?: string,
  ) {
    return this.patientsService.getPatientHistory(id, type);
  }

  @Post(':id/history')
  @ApiOperation({ summary: 'Add patient history entry' })
  async addHistoryEntry(
    @Param('id') id: string,
    @Body() historyData: any,
    @Request() req,
  ) {
    return this.patientsService.addHistoryEntry(id, historyData, req.user.id);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Get patient documents' })
  @ApiQuery({ name: 'type', required: false, type: String })
  async getPatientDocuments(
    @Param('id') id: string,
    @Query('type') type?: string,
  ) {
    return this.patientsService.getPatientDocuments(id, type);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload patient document' })
  async uploadDocument(
    @Param('id') id: string,
    @Body() documentData: any,
    @Request() req,
  ) {
    return this.patientsService.uploadDocument(
      id,
      req.user.clinicId,
      documentData,
      req.user.id,
    );
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get patient statistics' })
  async getPatientStats(@Param('id') id: string) {
    return this.patientsService.getPatientStats(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate patient' })
  async deactivatePatient(@Param('id') id: string) {
    return this.patientsService.deactivatePatient(id);
  }
}
