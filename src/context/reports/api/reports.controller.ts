import { 
  Controller, 
  Get, 
  Query, 
  Param, 
  UseGuards, 
  ValidationPipe,
  Res 
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from '../services/reports.service';
import { DashboardMetricsDto, GetReportDto } from '../dto/reports.dto';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard/:organizationId')
  @ApiOperation({ summary: 'Get dashboard metrics for organization' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved successfully' })
  async getDashboardMetrics(
    @Param('organizationId') organizationId: string,
    @Query(ValidationPipe) dto: DashboardMetricsDto
  ) {
    return this.reportsService.getDashboardMetrics(organizationId, dto);
  }

  @Get('export/:organizationId')
  @ApiOperation({ summary: 'Export specific report data' })
  @ApiResponse({ status: 200, description: 'Report data exported successfully' })
  async exportReport(
    @Param('organizationId') organizationId: string,
    @Query(ValidationPipe) dto: GetReportDto,
    @Res() res: Response
  ) {
    const buffer = await this.reportsService.exportReport(organizationId, dto);
    
    const fileName = `reporte-${dto.type}-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
  }

  @Get('clients/:organizationId')
  @ApiOperation({ summary: 'Get detailed client analytics' })
  @ApiResponse({ status: 200, description: 'Client analytics retrieved successfully' })
  async getClientAnalytics(
    @Param('organizationId') organizationId: string,
    @Query(ValidationPipe) dto: DashboardMetricsDto
  ) {
    const dateFilter = this.reportsService['getDateFilter'](
      dto.dateRange || 'last_30_days', 
      dto.startDate, 
      dto.endDate
    );
    return this.reportsService['getClientMetrics'](organizationId, dateFilter);
  }

  @Get('financial/:organizationId')
  @ApiOperation({ summary: 'Get financial analytics' })
  @ApiResponse({ status: 200, description: 'Financial analytics retrieved successfully' })
  async getFinancialAnalytics(
    @Param('organizationId') organizationId: string,
    @Query(ValidationPipe) dto: DashboardMetricsDto
  ) {
    const dateFilter = this.reportsService['getDateFilter'](
      dto.dateRange || 'last_30_days', 
      dto.startDate, 
      dto.endDate
    );
    return this.reportsService['getFinancialMetrics'](organizationId, dateFilter);
  }

  @Get('occupancy/:organizationId')
  @ApiOperation({ summary: 'Get occupancy analytics' })
  @ApiResponse({ status: 200, description: 'Occupancy analytics retrieved successfully' })
  async getOccupancyAnalytics(
    @Param('organizationId') organizationId: string,
    @Query(ValidationPipe) dto: DashboardMetricsDto
  ) {
    const dateFilter = this.reportsService['getDateFilter'](
      dto.dateRange || 'last_30_days', 
      dto.startDate, 
      dto.endDate
    );
    return this.reportsService['getOccupancyMetrics'](organizationId, dateFilter);
  }

  @Get('routines/:organizationId')
  @ApiOperation({ summary: 'Get routine analytics' })
  @ApiResponse({ status: 200, description: 'Routine analytics retrieved successfully' })
  async getRoutineAnalytics(
    @Param('organizationId') organizationId: string,
    @Query(ValidationPipe) dto: DashboardMetricsDto
  ) {
    const dateFilter = this.reportsService['getDateFilter'](
      dto.dateRange || 'last_30_days', 
      dto.startDate, 
      dto.endDate
    );
    return this.reportsService['getRoutineMetrics'](organizationId, dateFilter);
  }
} 