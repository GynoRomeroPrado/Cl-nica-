import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { TelemedicineService } from './telemedicine.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, ResourceOwnershipGuard, ClinicIsolationGuard } from '../../common/guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('telemedicine')
@UseGuards(JwtAuthGuard, ClinicIsolationGuard)
export class TelemedicineController {
  constructor(private readonly telemedicineService: TelemedicineService) {}

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  async createSession(@Request() req, @Body() sessionData: any) {
    return this.telemedicineService.createTelemedicineSession(
      sessionData.appointment_id,
      req.user.staff_id,
      sessionData.options,
    );
  }

  @Get('sessions/:sessionId')
  async getSessionById(@Param('sessionId') sessionId: string) {
    return this.telemedicineService.getSessionById(sessionId);
  }

  @Post('sessions/:sessionId/start')
  async startSession(@Param('sessionId') sessionId: string, @Request() req) {
    const userId = req.user.staff_id || req.user.patient_id;
    return this.telemedicineService.startSession(sessionId, userId);
  }

  @Post('sessions/:sessionId/end')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  async endSession(
    @Param('sessionId') sessionId: string,
    @Request() req,
    @Body() data: { session_notes?: string },
  ) {
    return this.telemedicineService.endSession(sessionId, req.user.staff_id, data.session_notes);
  }

  @Get('provider/upcoming')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  async getProviderUpcomingSessions(@Request() req, @Query('limit') limit?: string) {
    return this.telemedicineService.getProviderUpcomingSessions(
      req.user.staff_id,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Get('patient/:patientId/sessions')
  @UseGuards(ResourceOwnershipGuard)
  async getPatientSessions(@Param('patientId') patientId: string, @Query() filters: any) {
    return this.telemedicineService.getPatientSessions(patientId, filters);
  }

  @Post('join')
  async joinSessionByRoomCode(@Body() data: { room_code: string }, @Request() req) {
    const userId = req.user.staff_id || req.user.patient_id;
    return this.telemedicineService.joinSessionByRoomCode(data.room_code, userId);
  }

  @Post('sessions/:sessionId/token')
  async generateAccessToken(@Param('sessionId') sessionId: string, @Request() req) {
    const userId = req.user.staff_id || req.user.patient_id;
    const userRole = req.user.role === UserRole.PATIENT ? 'patient' : 'provider';
    return this.telemedicineService.generateAccessToken(sessionId, userId, userRole);
  }
}
