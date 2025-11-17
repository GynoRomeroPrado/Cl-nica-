import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(@Request() req, @Body() updates: any) {
    return this.usersService.updateProfile(req.user.id, updates);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  async getStats(@Request() req) {
    return this.usersService.getUserStats(req.user.id);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get user settings' })
  async getSettings(@Request() req) {
    return this.usersService.getUserSettings(req.user.id);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update user settings' })
  async updateSettings(@Request() req, @Body() settings: any) {
    return this.usersService.updateSettings(req.user.id, settings);
  }
}
