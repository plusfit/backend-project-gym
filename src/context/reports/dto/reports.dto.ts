import { IsOptional, IsDateString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReportType {
  CLIENTS = 'clients',
  FINANCIAL = 'financial',
  OCCUPANCY = 'occupancy',
  ROUTINES = 'routines',
  PERFORMANCE = 'performance',
}

export enum DateRange {
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_3_MONTHS = 'last_3_months',
  LAST_6_MONTHS = 'last_6_months',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

export class GetReportDto {
  @IsEnum(ReportType)
  type!: ReportType;

  @IsEnum(DateRange)
  dateRange!: DateRange;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

export class DashboardMetricsDto {
  @IsEnum(DateRange)
  @IsOptional()
  dateRange?: DateRange = DateRange.LAST_30_DAYS;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export interface ClientMetrics {
  totalClients: number;
  activeClients: number;
  newClientsThisPeriod: number;
  clientRetentionRate: number;
  averageAge: number;
  genderDistribution: { male: number; female: number; other: number };
  planDistribution: Array<{ planName: string; count: number; percentage: number }>;
  growthRate: number;
}

export interface FinancialMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  revenueByPlan: Array<{ planName: string; revenue: number; percentage: number }>;
  churnRate: number;
  averageRevenuePerUser: number;
  projectedRevenue: number;
  revenueGrowth: number;
}

export interface OccupancyMetrics {
  averageOccupancy: number;
  peakHours: Array<{ hour: string; occupancy: number }>;
  weeklyTrends: Array<{ day: string; occupancy: number }>;
  capacityUtilization: number;
  mostPopularSchedules: Array<{ 
    day: string; 
    time: string; 
    occupancy: number; 
    maxCapacity: number 
  }>;
}

export interface RoutineMetrics {
  mostPopularExercises: Array<{ name: string; count: number; category: string }>;
  planEffectiveness: Array<{ 
    planName: string; 
    completionRate: number; 
    clientSatisfaction: number 
  }>;
  exercisesByCategory: Array<{ category: string; count: number; percentage: number }>;
  routineUsage: Array<{ routineName: string; assignedClients: number }>;
}

export interface OrganizationMetrics {
  clientsUsage: { current: number; limit: number; percentage: number };
  adminsUsage: { current: number; limit: number; percentage: number };
  subscriptionStatus: string;
  daysUntilExpiration: number;
  featuresUsed: string[];
  performanceScore: number;
} 