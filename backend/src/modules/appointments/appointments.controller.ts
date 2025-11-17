import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get appointments with filters' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'doctorId', required: false, type: String })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'appointmentType', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getAppointments(@Request() req, @Query() filters: any) {
    return this.appointmentsService.getAppointments(req.user.clinicId, filters);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming appointments' })
  async getUpcomingAppointments(@Request() req, @Query('limit') limit = 20) {
    return this.appointmentsService.getUpcomingAppointments(req.user.clinicId, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get appointment statistics' })
  async getStats(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.appointmentsService.getAppointmentStats(req.user.clinicId, startDate, endDate);
  }

  @Get('availability/:doctorId')
  @ApiOperation({ summary: 'Get doctor availability for a date' })
  async getDoctorAvailability(
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getDoctorAvailability(doctorId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  async getAppointment(@Param('id') id: string) {
    return this.appointmentsService.getAppointmentById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new appointment' })
  async createAppointment(@Request() req, @Body() appointmentData: any) {
    return this.appointmentsService.createAppointment(req.user.clinicId, appointmentData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update appointment' })
  async updateAppointment(@Param('id') id: string, @Body() updates: any) {
    return this.appointmentsService.updateAppointment(id, updates);
  }

  @Patch(':id/check-in')
  @ApiOperation({ summary: 'Check-in patient for appointment' })
  async checkInPatient(@Param('id') id: string, @Request() req) {
    return this.appointmentsService.checkInPatient(id, req.user.id);
  }

  @Patch(':id/start')
  @ApiOperation({ summary: 'Start appointment (doctor begins)' })
  async startAppointment(@Param('id') id: string) {
    return this.appointmentsService.startAppointment(id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark appointment as completed' })
  async completeAppointment(@Param('id') id: string) {
    return this.appointmentsService.completeAppointment(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel appointment' })
  async cancelAppointment(
    @Param('id') id: string,
    @Body() cancellationData: any,
    @Request() req,
  ) {
    return this.appointmentsService.cancelAppointment(id, cancellationData, req.user.id);
  }
}
