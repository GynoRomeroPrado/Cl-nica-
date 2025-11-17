import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { MedicationsModule } from './modules/medications/medications.module';
import { HealthNewsModule } from './modules/health-news/health-news.module';
import { GamificationModule } from './modules/gamification/gamification.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting (100 requests per 15 minutes)
    ThrottlerModule.forRoot([
      {
        ttl: 15 * 60 * 1000, // 15 minutes in milliseconds
        limit: 100,
      },
    ]),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Cache (Redis)
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default TTL
      max: 100, // Maximum number of items in cache
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    WorkoutsModule,
    ExercisesModule,
    MedicationsModule,
    HealthNewsModule,
    GamificationModule,
  ],
})
export class AppModule {}
