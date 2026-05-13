import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    Request,
} from "@nestjs/common";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import busboy from "busboy";
import type { FastifyRequest } from "fastify";

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
    ) {}

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
        description: "Returns paginated notifications",
    })
    async findAll(
        @Query("page") page: number = 1,
        @Query("limit") limit: number = 10,
        @Query("status") status?: string,
        @Query("searchQ") searchQ?: string,
    ) {
        return await this.notificationsService.findAll(
            Number(page),
            Number(limit),
            status,
            searchQ,
        );
    }

    @Post("bulk-upload")
    @ApiConsumes("multipart/form-data")
    @ApiOperation({ summary: "Upload CSV for bulk WhatsApp notifications" })
    @ApiResponse({ status: 202, description: "Bulk processing started" })
    @ApiResponse({ status: 400, description: "Bad request" })
    async bulkUpload(@Req() req: FastifyRequest) {
        const file = await new Promise<{
            originalname: string;
            mimetype: string;
            buffer: Buffer;
        }>((resolve, reject) => {
            const bb = busboy({ headers: req.headers });
            const chunks: Buffer[] = [];
            let filename = "";
            let mimetype = "";
            let fileReceived = false;

            bb.on("file", (_field: string, stream: NodeJS.ReadableStream, info: { filename: string; mimeType: string }) => {
                fileReceived = true;
                filename = info.filename;
                mimetype = info.mimeType;
                stream.on("data", (chunk: Buffer) => chunks.push(chunk));
                stream.on("error", reject);
            });

            bb.on("close", () => {
                if (!fileReceived) {
                    reject(new BadRequestException("No file uploaded"));
                    return;
                }
                resolve({
                    originalname: filename,
                    mimetype,
                    buffer: Buffer.concat(chunks),
                });
            });

            bb.on("error", reject);
            req.raw.pipe(bb);
        });

        return await this.notificationsService.bulkUpload(file);
    }

    @Get("bulk-status/:batchId")
    @ApiOperation({ summary: "Get bulk notification batch status" })
    @ApiResponse({
        status: 200,
        description: "Returns batch status",
    })
    @ApiResponse({ status: 404, description: "Batch not found" })
    async getBulkStatus(@Param("batchId") batchId: string) {
        return await this.notificationsService.getBulkStatus(batchId);
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

    @Delete(":id")
    @ApiOperation({ summary: "Delete a notification" })
    @ApiResponse({
        status: 200,
        description: "Notification deleted successfully",
    })
    @ApiResponse({ status: 404, description: "Notification not found" })
    async remove(@Param("id") id: string) {
        return await this.notificationsService.remove(id);
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

    @Post("delete-old")
    @ApiOperation({ summary: "Manually trigger old notifications cleanup" })
    @ApiResponse({
        status: 200,
        description: "Old notifications cleanup completed",
    })
    async deleteOldNotifications() {
        return await this.inactivityCheckService.manualDeleteOldNotifications();
    }
}