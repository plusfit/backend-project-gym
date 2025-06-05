import { 
  Controller, 
  Get, 
  Query, 
  Param, 
  UseGuards, 
  ValidationPipe,
  Res 
} from '@nestjs/common';

import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from '../services/reports.service';
import { DashboardMetricsDto, GetReportDto, DateRange } from '../dto/reports.dto';
import { PermissionsGuard } from '../../shared/guards/permissions/permissions.guard';
import { RequirePermissions } from '../../shared/guards/permissions/permissions.decorator';
import { Permission, Module } from '../../shared/enums/permissions.enum';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@UseGuards(PermissionsGuard)
@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard/:organizationId')
  @RequirePermissions(Module.REPORTS, [Permission.REPORTS_VIEW])
  @ApiOperation({ summary: 'Get dashboard metrics for organization' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved successfully' })
  async getDashboardMetrics(
    @Param('organizationId') organizationId: string,
    @Query(ValidationPipe) dto: DashboardMetricsDto
  ) {
    return this.reportsService.getDashboardMetrics(organizationId, dto);
  }

  @Get('export/:organizationId')
  @RequirePermissions(Module.REPORTS, [Permission.REPORTS_EXPORT])
  @ApiOperation({ summary: 'Export specific report data' })
  @ApiResponse({ status: 200, description: 'Report data exported successfully' })
  async exportReport(
    @Param('organizationId') organizationId: string,
    @Query(ValidationPipe) dto: GetReportDto,
    @Res() res: any
  ) {
    const buffer = await this.reportsService.exportReport(organizationId, dto);
    
    const fileName = `reporte-${dto.type}-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res
      .type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', `attachment; filename="${fileName}"`)
      .header('Content-Length', buffer.length.toString())
      .send(buffer);
  }

  @Get('clients/:organizationId')
  @RequirePermissions(Module.REPORTS, [Permission.REPORTS_VIEW])
  @ApiOperation({ summary: 'Get detailed client analytics' })
  @ApiResponse({ status: 200, description: 'Client analytics retrieved successfully' })
  async getClientAnalytics(
    @Param('organizationId') organizationId: string,
    @Query(ValidationPipe) dto: DashboardMetricsDto
  ) {
    const dateFilter = this.reportsService['getDateFilter'](
      dto.dateRange || DateRange.LAST_30_DAYS, 
      dto.startDate, 
      dto.endDate
    );
    return this.reportsService['getClientMetrics'](organizationId, dateFilter);
  }

  @Get('financial/:organizationId')
  @RequirePermissions(Module.REPORTS, [Permission.REPORTS_ADVANCED])
  @ApiOperation({ summary: 'Get financial analytics' })
  @ApiResponse({ status: 200, description: 'Financial analytics retrieved successfully' })
  async getFinancialAnalytics(
    @Param('organizationId') organizationId: string,
    @Query(ValidationPipe) dto: DashboardMetricsDto
  ) {
    const dateFilter = this.reportsService['getDateFilter'](
      dto.dateRange || DateRange.LAST_30_DAYS, 
      dto.startDate, 
      dto.endDate
    );
    return this.reportsService['getFinancialMetrics'](organizationId, dateFilter);
  }

  @Get('occupancy/:organizationId')
  @RequirePermissions(Module.REPORTS, [Permission.REPORTS_VIEW])
  @ApiOperation({ summary: 'Get occupancy analytics' })
  @ApiResponse({ status: 200, description: 'Occupancy analytics retrieved successfully' })
  async getOccupancyAnalytics(
    @Param('organizationId') organizationId: string,
    @Query(ValidationPipe) dto: DashboardMetricsDto
  ) {
    const dateFilter = this.reportsService['getDateFilter'](
      dto.dateRange || DateRange.LAST_30_DAYS, 
      dto.startDate, 
      dto.endDate
    );
    return this.reportsService['getOccupancyMetrics'](organizationId, dateFilter);
  }

  @Get('routines/:organizationId')
  @RequirePermissions(Module.REPORTS, [Permission.REPORTS_VIEW])
  @ApiOperation({ summary: 'Get routine analytics' })
  @ApiResponse({ status: 200, description: 'Routine analytics retrieved successfully' })
  async getRoutineAnalytics(
    @Param('organizationId') organizationId: string,
    @Query(ValidationPipe) dto: DashboardMetricsDto
  ) {
    const dateFilter = this.reportsService['getDateFilter'](
      dto.dateRange || DateRange.LAST_30_DAYS, 
      dto.startDate, 
      dto.endDate
    );
    return this.reportsService['getRoutineMetrics'](organizationId, dateFilter);
  }
} 