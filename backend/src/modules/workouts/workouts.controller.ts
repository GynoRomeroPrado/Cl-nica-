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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkoutsService } from './workouts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('workouts')
@Controller('workouts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user workouts' })
  async getWorkouts(
    @Request() req,
    @Query('limit') limit = 20,
    @Query('offset') offset = 0,
  ) {
    return this.workoutsService.getWorkouts(req.user.id, limit, offset);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workout by ID' })
  async getWorkout(@Param('id') id: string) {
    return this.workoutsService.getWorkoutById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new workout' })
  async createWorkout(@Request() req, @Body() workoutData: any) {
    return this.workoutsService.createWorkout(req.user.id, workoutData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update workout' })
  async updateWorkout(@Param('id') id: string, @Body() updates: any) {
    return this.workoutsService.updateWorkout(id, updates);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workout' })
  async deleteWorkout(@Param('id') id: string) {
    return this.workoutsService.deleteWorkout(id);
  }
}
