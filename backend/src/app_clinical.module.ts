import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';

// Authentication & Authorization
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

// Clinical Modules
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
// import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
// import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
// import { LabOrdersModule } from './modules/lab-orders/lab-orders.module';
// import { TelemedicineModule } from './modules/telemedicine/telemedicine.module';
// import { BillingModule } from './modules/billing/billing.module';

// Optional Wellness Modules
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

    // Core Modules
    AuthModule,
    UsersModule,

    // Clinical Modules
    PatientsModule,
    AppointmentsModule,
    // MedicalRecordsModule, // To be implemented
    // PrescriptionsModule, // To be implemented
    // LabOrdersModule, // To be implemented
    // TelemedicineModule, // To be implemented
    // BillingModule, // To be implemented

    // Optional Wellness Modules (can be disabled per clinic)
    WorkoutsModule,
    ExercisesModule,
    MedicationsModule,
    HealthNewsModule,
    GamificationModule,
  ],
})
export class AppClinicalModule {}
