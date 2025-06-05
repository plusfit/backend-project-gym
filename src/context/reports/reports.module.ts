import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './api/reports.controller';
import { ReportsService } from './services/reports.service';
import { Client, ClientSchema } from '../clients/schemas/client.schema';
import { Schedule, ScheduleSchema } from '../schedules/schemas/schedule.schema';
import { Plan, PlanSchema } from '../plans/schemas/plan.schema';
import { Routine, RoutineSchema } from '../routines/schemas/routine.schema';
import { Exercise, ExerciseSchema } from '../exercises/schemas/exercise.schema';
import { Organization, OrganizationSchema } from '../organizations/schemas/organization.schema';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: Schedule.name, schema: ScheduleSchema },
      { name: Plan.name, schema: PlanSchema },
      { name: Routine.name, schema: RoutineSchema },
      { name: Exercise.name, schema: ExerciseSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
    OrganizationsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {} 