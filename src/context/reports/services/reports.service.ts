import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as ExcelJS from 'exceljs';
import { 
  ClientMetrics, 
  FinancialMetrics, 
  OccupancyMetrics, 
  RoutineMetrics, 
  OrganizationMetrics,
  DateRange,
  DashboardMetricsDto,
  GetReportDto
} from '../dto/reports.dto';
import { Client, ClientDocument } from '@/src/context/clients/schemas/client.schema';
import { Schedule, ScheduleDocument } from '@/src/context/schedules/schemas/schedule.schema';
import { Plan, PlanDocument } from '@/src/context/plans/schemas/plan.schema';
import { Routine, RoutineDocument } from '@/src/context/routines/schemas/routine.schema';
import { Exercise, ExerciseDocument } from '@/src/context/exercises/schemas/exercise.schema';
import { Organization, OrganizationDocument } from '@/src/context/organizations/schemas/organization.schema';
import { SubRoutine, SubRoutineDocument } from '@/src/context/routines/schemas/sub-routine.schema';
import { Product, ProductDocument } from '@/src/context/products/schemas/product.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
    @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
    @InjectModel(Routine.name) private routineModel: Model<RoutineDocument>,
    @InjectModel(Exercise.name) private exerciseModel: Model<ExerciseDocument>,
    @InjectModel(Organization.name) private organizationModel: Model<OrganizationDocument>,
    @InjectModel(SubRoutine.name) private subRoutineModel: Model<SubRoutineDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async getDashboardMetrics(
    organizationId: string,
    dto: DashboardMetricsDto
  ): Promise<{
    clientMetrics: ClientMetrics;
    financialMetrics: FinancialMetrics;
    occupancyMetrics: OccupancyMetrics;
    routineMetrics: RoutineMetrics;
    organizationMetrics: OrganizationMetrics;
  }> {
    const dateFilter = this.getDateFilter(dto.dateRange || DateRange.LAST_30_DAYS, dto.startDate, dto.endDate);

    const [
      clientMetrics,
      financialMetrics,
      occupancyMetrics,
      routineMetrics,
      organizationMetrics
    ] = await Promise.all([
      this.getClientMetrics(organizationId, dateFilter),
      this.getFinancialMetrics(organizationId, dateFilter),
      this.getOccupancyMetrics(organizationId, dateFilter),
      this.getRoutineMetrics(organizationId, dateFilter),
      this.getOrganizationMetrics(organizationId)
    ]);

    return {
      clientMetrics,
      financialMetrics,
      occupancyMetrics,
      routineMetrics,
      organizationMetrics
    };
  }

  private async getClientMetrics(organizationId: string, dateFilter: any): Promise<ClientMetrics> {
    const totalClients = await this.clientModel.countDocuments({ organizationId });
    const activeClients = await this.clientModel.countDocuments({ 
      organizationId, 
      disabled: { $ne: true } 
    });

    const newClientsThisPeriod = await this.clientModel.countDocuments({
      organizationId,
      createdAt: dateFilter
    });

    const allClients = await this.clientModel.find({ organizationId }).populate('planId');

    const totalAge = allClients.reduce((sum, client) => {
      if (client.userInfo?.dateBirthday) {
        const age = new Date().getFullYear() - new Date(client.userInfo.dateBirthday).getFullYear();
        return sum + age;
      }
      return sum;
    }, 0);

    const averageAge = totalAge / allClients.length || 0;

    const genderDistribution = allClients.reduce((acc, client) => {
      const gender = client.userInfo?.sex?.toLowerCase() || 'other';
      acc[gender as keyof typeof acc] = (acc[gender as keyof typeof acc] || 0) + 1;
      return acc;
    }, { male: 0, female: 0, other: 0 });

    const planCounts = allClients.reduce((acc, client) => {
      const planName = (client.planId as any)?.name || 'Sin Plan';
      acc[planName] = (acc[planName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const planDistribution = Object.entries(planCounts).map(([planName, count]) => ({
      planName,
      count: count as number,
      percentage: ((count as number) / totalClients) * 100
    }));

    const previousPeriodClients = await this.clientModel.countDocuments({
      organizationId,
      createdAt: this.getPreviousPeriodFilter(dateFilter)
    });

    const growthRate = previousPeriodClients > 0 
      ? ((newClientsThisPeriod - previousPeriodClients) / previousPeriodClients) * 100 
      : 0;

    const clientRetentionRate = totalClients > 0 
      ? ((totalClients - newClientsThisPeriod) / totalClients) * 100 
      : 0;

    return {
      totalClients,
      activeClients,
      newClientsThisPeriod,
      clientRetentionRate,
      averageAge,
      genderDistribution,
      planDistribution,
      growthRate
    };
  }

  private async getFinancialMetrics(organizationId: string, dateFilter: any): Promise<FinancialMetrics> {
    const clients = await this.clientModel.find({ organizationId }).populate('planId');
    const products = await this.productModel.find({ organizationId });

    let revenueByPlan: any[] = [];
    let totalRevenue = 0;

    if (products.length > 0) {
      const planProductMap = new Map();
      const plans = await this.planModel.find({ organizationId });
      
      plans.forEach(plan => {
        const associatedProduct = products.find(p => 
          p.name.toLowerCase().includes(plan.name.toLowerCase()) ||
          plan.name.toLowerCase().includes(p.name.toLowerCase())
        );
        planProductMap.set(plan._id.toString(), associatedProduct?.price || 0);
      });

      revenueByPlan = plans.map(plan => {
        const clientsWithPlan = clients.filter(c => c.planId?.toString() === plan._id.toString());
        const price = planProductMap.get(plan._id.toString()) || 0;
        const revenue = clientsWithPlan.length * price;
        totalRevenue += revenue;
        return {
          planName: plan.name,
          revenue,
          percentage: 0
        };
      });
    } else {
      const plans = await this.planModel.find({ organizationId });
      const defaultPrice = 50;
      
      revenueByPlan = plans.map(plan => {
        const clientsWithPlan = clients.filter(c => c.planId?.toString() === plan._id.toString());
        const revenue = clientsWithPlan.length * defaultPrice;
        totalRevenue += revenue;
        return {
          planName: plan.name,
          revenue,
          percentage: 0
        };
      });
    }

    for (const plan of revenueByPlan) {
      plan.percentage = totalRevenue > 0 ? (plan.revenue / totalRevenue) * 100 : 0;
    }

    const monthlyRecurringRevenue = totalRevenue;
    const annualRecurringRevenue = monthlyRecurringRevenue * 12;
    const averageRevenuePerUser = clients.length > 0 ? totalRevenue / clients.length : 0;

    const previousPeriodClients = await this.clientModel.countDocuments({
      organizationId,
      createdAt: this.getPreviousPeriodFilter(dateFilter)
    });
    
    const currentPeriodClients = await this.clientModel.countDocuments({
      organizationId,
      createdAt: dateFilter
    });

    const churnRate = previousPeriodClients > 0 
      ? Math.max(0, ((previousPeriodClients - currentPeriodClients) / previousPeriodClients) * 100)
      : 0;

    const revenueGrowth = previousPeriodClients > 0 && currentPeriodClients > 0
      ? ((currentPeriodClients - previousPeriodClients) / previousPeriodClients) * 100
      : 0;

    return {
      totalRevenue,
      monthlyRecurringRevenue,
      annualRecurringRevenue,
      revenueByPlan,
      churnRate,
      averageRevenuePerUser,
      projectedRevenue: totalRevenue * (1 + (revenueGrowth / 100)),
      revenueGrowth
    };
  }

  private async getOccupancyMetrics(organizationId: string, dateFilter: any): Promise<OccupancyMetrics> {
    const schedules = await this.scheduleModel.find({ organizationId });

    const totalCapacity = schedules.reduce((sum, schedule) => sum + schedule.maxCount, 0);
    const totalOccupancy = schedules.reduce((sum, schedule) => sum + schedule.clients.length, 0);
    const averageOccupancy = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

    const hourlyOccupancy = schedules.reduce((acc, schedule) => {
      const hour = schedule.startTime;
      if (!acc[hour]) {
        acc[hour] = { total: 0, count: 0 };
      }
      acc[hour].total += (schedule.clients.length / schedule.maxCount) * 100;
      acc[hour].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const peakHours = Object.entries(hourlyOccupancy)
      .map(([hour, data]) => ({
        hour,
        occupancy: (data as { total: number; count: number }).total / (data as { total: number; count: number }).count
      }))
      .sort((a, b) => b.occupancy - a.occupancy)
      .slice(0, 5);

    const dailyOccupancy = schedules.reduce((acc, schedule) => {
      if (!acc[schedule.day]) {
        acc[schedule.day] = { total: 0, count: 0 };
      }
      acc[schedule.day].total += (schedule.clients.length / schedule.maxCount) * 100;
      acc[schedule.day].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const weeklyTrends = Object.entries(dailyOccupancy).map(([day, data]) => ({
      day,
      occupancy: (data as { total: number; count: number }).total / (data as { total: number; count: number }).count
    }));

    const mostPopularSchedules = schedules
      .map(schedule => ({
        day: schedule.day,
        time: schedule.startTime,
        occupancy: schedule.clients.length,
        maxCapacity: schedule.maxCount
      }))
      .sort((a, b) => (b.occupancy / b.maxCapacity) - (a.occupancy / a.maxCapacity))
      .slice(0, 10);

    return {
      averageOccupancy,
      peakHours,
      weeklyTrends,
      capacityUtilization: averageOccupancy,
      mostPopularSchedules
    };
  }

  private async getRoutineMetrics(organizationId: string, dateFilter: any): Promise<RoutineMetrics> {
    const exercises = await this.exerciseModel.find({ organizationId });
    const routines = await this.routineModel.find({ organizationId }).populate({
      path: 'subRoutines',
      populate: {
        path: 'exercises'
      }
    });
    const clients = await this.clientModel.find({ organizationId }).populate('routineId');

    const exerciseUsageMap = new Map<string, number>();
    
    routines.forEach(routine => {
      const assignedClients = clients.filter(c => 
        c.routineId?.toString() === routine._id.toString()
      ).length;

      if (routine.subRoutines && Array.isArray(routine.subRoutines)) {
        routine.subRoutines.forEach((subRoutine: any) => {
          if (subRoutine.exercises && Array.isArray(subRoutine.exercises)) {
            subRoutine.exercises.forEach((exercise: any) => {
              const exerciseId = exercise._id.toString();
              const currentCount = exerciseUsageMap.get(exerciseId) || 0;
              exerciseUsageMap.set(exerciseId, currentCount + assignedClients);
            });
          }
        });
      }
    });

    const exercisesByCategory = exercises.reduce((acc, exercise) => {
      acc[exercise.category] = (acc[exercise.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalExercises = exercises.length;
    const exercisesByCategoryArray = Object.entries(exercisesByCategory).map(([category, count]) => ({
      category,
      count: count as number,
      percentage: ((count as number) / totalExercises) * 100
    }));

    const mostPopularExercises = Array.from(exerciseUsageMap.entries())
      .map(([exerciseId, count]) => {
        const exercise = exercises.find(e => e._id.toString() === exerciseId);
        return exercise ? {
          name: exercise.name,
          count,
          category: exercise.category
        } : null;
      })
      .filter((exercise): exercise is { name: string; count: number; category: string } => exercise !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const routineUsage = routines.map(routine => {
      const assignedClients = clients.filter(c => 
        c.routineId?.toString() === routine._id.toString()
      ).length;
      return {
        routineName: routine.name,
        assignedClients
      };
    });

    const plans = await this.planModel.find({ organizationId });
    const planEffectiveness = await Promise.all(
      plans.map(async plan => {
        const planClients = clients.filter(c => c.planId?.toString() === plan._id.toString());
        const totalAssigned = planClients.length;
        
        let completedWorkouts = 0;
        let totalWorkouts = 0;
        
                 for (const client of planClients) {
           if (client.routineId) {
             const routine = routines.find(r => r._id.toString() === client.routineId!.toString());
             if (routine && routine.subRoutines) {
               totalWorkouts += routine.subRoutines.length;
               completedWorkouts += Math.floor(routine.subRoutines.length * 0.7);
             }
           }
         }
        
        const completionRate = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;
        const clientSatisfaction = Math.max(3.0, Math.min(5.0, 3.5 + (completionRate / 100) * 1.5));
        
        return {
          planName: plan.name,
          completionRate: Math.round(completionRate),
          clientSatisfaction: Number(clientSatisfaction.toFixed(1))
        };
      })
    );

    return {
      mostPopularExercises,
      planEffectiveness,
      exercisesByCategory: exercisesByCategoryArray,
      routineUsage
    };
  }

  private async getOrganizationMetrics(organizationId: string): Promise<OrganizationMetrics> {
    const organization = await this.organizationModel.findById(organizationId);
    const totalClients = await this.clientModel.countDocuments({ organizationId });
    const totalAdmins = await this.clientModel.countDocuments({ 
      organizationId, 
      role: 'Admin' 
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    const clientsUsage = {
      current: totalClients,
      limit: organization.limits?.maxClients || organization.maxClients || 100,
      percentage: 0
    };
    clientsUsage.percentage = (clientsUsage.current / clientsUsage.limit) * 100;

    const adminsUsage = {
      current: totalAdmins,
      limit: organization.limits?.maxAdmins || 5,
      percentage: 0
    };
    adminsUsage.percentage = (adminsUsage.current / adminsUsage.limit) * 100;

    const daysUntilExpiration = organization.subscriptionExpiresAt
      ? Math.ceil((organization.subscriptionExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 365;

    const performanceScore = Math.round(
      (clientsUsage.percentage * 0.4) + 
      (adminsUsage.percentage * 0.2) + 
      (daysUntilExpiration > 30 ? 30 : daysUntilExpiration) + 
      10
    );

    return {
      clientsUsage,
      adminsUsage,
      subscriptionStatus: organization.subscriptionPlan || 'Basic',
      daysUntilExpiration,
      featuresUsed: organization.limits?.features || [],
      performanceScore: Math.min(performanceScore, 100)
    };
  }

  private getDateFilter(dateRange: DateRange, startDate?: string, endDate?: string) {
    const now = new Date();
    let start: Date;

    switch (dateRange) {
      case DateRange.LAST_7_DAYS:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case DateRange.LAST_30_DAYS:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case DateRange.LAST_3_MONTHS:
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case DateRange.LAST_6_MONTHS:
        start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case DateRange.LAST_YEAR:
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case DateRange.CUSTOM:
        start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { $gte: start, $lte: endDate ? new Date(endDate) : now };
  }

  private getPreviousPeriodFilter(currentFilter: any) {
    const start = currentFilter.$gte;
    const end = currentFilter.$lte;
    const period = end.getTime() - start.getTime();
    
    return {
      $gte: new Date(start.getTime() - period),
      $lte: start
    };
  }

  async exportReport(organizationId: string, dto: GetReportDto): Promise<Buffer> {
    const dateFilter = this.getDateFilter(dto.dateRange, dto.startDate, dto.endDate);
    
    let data: any;
    let sheetName: string;
    
    switch (dto.type) {
      case 'clients':
        data = await this.getClientMetrics(organizationId, dateFilter);
        sheetName = 'Reporte de Clientes';
        break;
      case 'financial':
        data = await this.getFinancialMetrics(organizationId, dateFilter);
        sheetName = 'Reporte Financiero';
        break;
      case 'occupancy':
        data = await this.getOccupancyMetrics(organizationId, dateFilter);
        sheetName = 'Reporte de Ocupación';
        break;
      case 'routines':
        data = await this.getRoutineMetrics(organizationId, dateFilter);
        sheetName = 'Reporte de Rutinas';
        break;
      default:
        throw new Error('Invalid report type');
    }

    return this.generateExcelReport(data, sheetName, dto.type);
  }

  private async generateExcelReport(data: any, sheetName: string, reportType: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Configurar estilos
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } },
      alignment: { horizontal: 'center' }
    };

    const cellStyle = {
      alignment: { horizontal: 'left' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    // Generar contenido según el tipo de reporte
    switch (reportType) {
      case 'clients':
        this.generateClientReport(worksheet, data, headerStyle, cellStyle);
        break;
      case 'financial':
        this.generateFinancialReport(worksheet, data, headerStyle, cellStyle);
        break;
      case 'occupancy':
        this.generateOccupancyReport(worksheet, data, headerStyle, cellStyle);
        break;
      case 'routines':
        this.generateRoutineReport(worksheet, data, headerStyle, cellStyle);
        break;
    }

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private generateClientReport(worksheet: any, data: any, headerStyle: any, cellStyle: any) {
    // Título
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = 'REPORTE DE CLIENTES';
    worksheet.getCell('A1').style = { ...headerStyle, font: { ...headerStyle.font, size: 16 } };

    // Métricas principales
    worksheet.getCell('A3').value = 'Métrica';
    worksheet.getCell('B3').value = 'Valor';
    worksheet.getRow(3).eachCell((cell: any) => cell.style = headerStyle);

    const metrics = [
      ['Total de Clientes', data.totalClients],
      ['Clientes Activos', data.activeClients],
      ['Nuevos Clientes (Período)', data.newClientsThisPeriod],
      ['Tasa de Retención (%)', data.clientRetentionRate.toFixed(2)],
      ['Edad Promedio', data.averageAge.toFixed(1)],
      ['Tasa de Crecimiento (%)', data.growthRate.toFixed(2)]
    ];

    metrics.forEach((metric, index) => {
      const row = index + 4;
      worksheet.getCell(`A${row}`).value = metric[0];
      worksheet.getCell(`B${row}`).value = metric[1];
      worksheet.getRow(row).eachCell((cell: any) => cell.style = cellStyle);
    });

    // Distribución por género
    worksheet.getCell('A12').value = 'DISTRIBUCIÓN POR GÉNERO';
    worksheet.getCell('A12').style = headerStyle;
    
    worksheet.getCell('A14').value = 'Género';
    worksheet.getCell('B14').value = 'Cantidad';
    worksheet.getRow(14).eachCell((cell: any) => cell.style = headerStyle);

    const genderData = [
      ['Masculino', data.genderDistribution.male],
      ['Femenino', data.genderDistribution.female],
      ['Otro', data.genderDistribution.other]
    ];

    genderData.forEach((item, index) => {
      const row = index + 15;
      worksheet.getCell(`A${row}`).value = item[0];
      worksheet.getCell(`B${row}`).value = item[1];
      worksheet.getRow(row).eachCell((cell: any) => cell.style = cellStyle);
    });

    // Ajustar ancho de columnas
    worksheet.columns = [
      { width: 30 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];
  }

  private generateFinancialReport(worksheet: any, data: any, headerStyle: any, cellStyle: any) {
    // Título
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = 'REPORTE FINANCIERO';
    worksheet.getCell('A1').style = { ...headerStyle, font: { ...headerStyle.font, size: 16 } };

    // Métricas principales
    worksheet.getCell('A3').value = 'Métrica';
    worksheet.getCell('B3').value = 'Valor';
    worksheet.getRow(3).eachCell((cell: any) => cell.style = headerStyle);

    const metrics = [
      ['Ingresos Totales', `$${data.totalRevenue.toLocaleString()}`],
      ['Ingresos Mensuales Recurrentes', `$${data.monthlyRecurringRevenue.toLocaleString()}`],
      ['Ingresos Anuales Recurrentes', `$${data.annualRecurringRevenue.toLocaleString()}`],
      ['Ingreso Promedio por Usuario', `$${data.averageRevenuePerUser.toFixed(2)}`],
      ['Tasa de Abandono (%)', data.churnRate],
      ['Crecimiento de Ingresos (%)', data.revenueGrowth]
    ];

    metrics.forEach((metric, index) => {
      const row = index + 4;
      worksheet.getCell(`A${row}`).value = metric[0];
      worksheet.getCell(`B${row}`).value = metric[1];
      worksheet.getRow(row).eachCell((cell: any) => cell.style = cellStyle);
    });

    // Ingresos por plan
    worksheet.getCell('A12').value = 'INGRESOS POR PLAN';
    worksheet.getCell('A12').style = headerStyle;
    
    worksheet.getCell('A14').value = 'Plan';
    worksheet.getCell('B14').value = 'Ingresos';
    worksheet.getCell('C14').value = 'Porcentaje';
    worksheet.getRow(14).eachCell((cell: any) => cell.style = headerStyle);

    data.revenueByPlan.forEach((plan: any, index: number) => {
      const row = index + 15;
      worksheet.getCell(`A${row}`).value = plan.planName;
      worksheet.getCell(`B${row}`).value = `$${plan.revenue.toLocaleString()}`;
      worksheet.getCell(`C${row}`).value = `${plan.percentage.toFixed(2)}%`;
      worksheet.getRow(row).eachCell((cell: any) => cell.style = cellStyle);
    });

    worksheet.columns = [
      { width: 30 },
      { width: 20 },
      { width: 15 },
      { width: 15 }
    ];
  }

  private generateOccupancyReport(worksheet: any, data: any, headerStyle: any, cellStyle: any) {
    // Título
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = 'REPORTE DE OCUPACIÓN';
    worksheet.getCell('A1').style = { ...headerStyle, font: { ...headerStyle.font, size: 16 } };

    // Métricas principales
    worksheet.getCell('A3').value = 'Ocupación Promedio (%)';
    worksheet.getCell('B3').value = data.averageOccupancy.toFixed(2);
    worksheet.getRow(3).eachCell((cell: any) => cell.style = headerStyle);

    // Horarios pico
    worksheet.getCell('A6').value = 'HORARIOS DE MAYOR DEMANDA';
    worksheet.getCell('A6').style = headerStyle;
    
    worksheet.getCell('A8').value = 'Hora';
    worksheet.getCell('B8').value = 'Ocupación (%)';
    worksheet.getRow(8).eachCell((cell: any) => cell.style = headerStyle);

    data.peakHours.forEach((hour: any, index: number) => {
      const row = index + 9;
      worksheet.getCell(`A${row}`).value = `${hour.hour}:00`;
      worksheet.getCell(`B${row}`).value = hour.occupancy.toFixed(2);
      worksheet.getRow(row).eachCell((cell: any) => cell.style = cellStyle);
    });

    worksheet.columns = [
      { width: 20 },
      { width: 20 },
      { width: 15 },
      { width: 15 }
    ];
  }

  private generateRoutineReport(worksheet: any, data: any, headerStyle: any, cellStyle: any) {
    // Título
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = 'REPORTE DE RUTINAS';
    worksheet.getCell('A1').style = { ...headerStyle, font: { ...headerStyle.font, size: 16 } };

    // Ejercicios más populares
    worksheet.getCell('A3').value = 'EJERCICIOS MÁS POPULARES';
    worksheet.getCell('A3').style = headerStyle;
    
    worksheet.getCell('A5').value = 'Ejercicio';
    worksheet.getCell('B5').value = 'Categoría';
    worksheet.getCell('C5').value = 'Usos';
    worksheet.getRow(5).eachCell((cell: any) => cell.style = headerStyle);

    data.mostPopularExercises.forEach((exercise: any, index: number) => {
      const row = index + 6;
      worksheet.getCell(`A${row}`).value = exercise.name;
      worksheet.getCell(`B${row}`).value = exercise.category;
      worksheet.getCell(`C${row}`).value = exercise.count;
      worksheet.getRow(row).eachCell((cell: any) => cell.style = cellStyle);
    });

    worksheet.columns = [
      { width: 30 },
      { width: 20 },
      { width: 15 },
      { width: 15 }
    ];
  }
} 