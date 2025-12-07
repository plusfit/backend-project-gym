import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { CreateNotificationDto } from "./dto/create-notification.dto";
import { UpdateNotificationDto } from "./dto/update-notification.dto";
import { NotificationsService } from "./notifications.service";
import { InactivityCheckService } from "./services/inactivity-check.service";

@ApiTags("notifications")
@Controller("notifications")
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly inactivityCheckService: InactivityCheckService,
    ) { }

    @Post()
    @ApiOperation({ summary: "Create a new notification" })
    @ApiResponse({
        status: 201,
        description: "Notification created successfully",
    })
    @ApiResponse({ status: 400, description: "Bad request" })
    async create(@Body() createNotificationDto: CreateNotificationDto) {
        return await this.notificationsService.create(createNotificationDto);
    }

    @Get()
    @ApiOperation({ summary: "Get all notifications" })
    @ApiResponse({
        status: 200,
        description: "Returns all notifications",
    })
    async findAll() {
        return await this.notificationsService.findAll();
    }

    @Patch(":id")
    @ApiOperation({ summary: "Update a notification" })
    @ApiResponse({
        status: 200,
        description: "Notification updated successfully",
    })
    @ApiResponse({ status: 404, description: "Notification not found" })
    async update(
        @Param("id") id: string,
        @Body() updateNotificationDto: UpdateNotificationDto,
    ) {
        return await this.notificationsService.update(id, updateNotificationDto);
    }

    @Post("check-inactivity")
    @ApiOperation({ summary: "Manually trigger inactivity check" })
    @ApiResponse({
        status: 200,
        description: "Inactivity check completed",
    })
    async checkInactivity() {
        return await this.inactivityCheckService.manualCheck();
    }
}
