import {
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    NotFoundException,
    BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import FormData from "form-data";

import { CreateNotificationDto } from "./dto/create-notification.dto";
import { UpdateNotificationDto } from "./dto/update-notification.dto";
import { BulkUploadResponseDto } from "./dto/bulk-upload.dto";
import { BulkStatusResponseDto } from "./dto/bulk-status.dto";
import { NOTIFICATION_REPOSITORY } from "./repositories/notifications.repository";
import { Notification } from "./schemas/notification.schema";

interface CsvRow {
    to: string;
    message: string;
}

export interface UploadedCsvFile {
    originalname: string;
    mimetype: string;
    buffer: Buffer;
}

@Injectable()
export class NotificationsService {
    constructor(
        @Inject(NOTIFICATION_REPOSITORY)
        private readonly notificationRepository: any,
        private readonly configService: ConfigService,
    ) {}

    private parseCSV(buffer: Buffer): CsvRow[] {
        const content = buffer.toString("utf-8");
        const lines = content.split("\n").filter((line) => line.trim() !== "");

        if (lines.length === 0) {
            throw new BadRequestException("File is empty");
        }

        const header = lines[0].toLowerCase();
        const hasToColumn = header.includes("to");
        const hasMessageColumn = header.includes("message");

        if (!hasToColumn || !hasMessageColumn) {
            throw new BadRequestException(
                `Missing required column. CSV must have 'to' and 'message' columns. Found: ${header}`,
            );
        }

        const rows: CsvRow[] = [];
        const dataLines = lines.slice(1);

        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i].trim();
            if (!line) continue;

            const parts = line.split(",");
            if (parts.length < 2) {
                throw new BadRequestException(
                    `Invalid row format at line ${i + 2}: expected "phone,message"`,
                );
            }

            const to = parts[0].trim();
            const message = parts.slice(1).join(",").trim();

            rows.push({ to, message });
        }

        return rows;
    }

    private validatePhoneNumber(phone: string): boolean {
        const e164Regex = /^\+598\d{8}$/;
        return e164Regex.test(phone);
    }

    async bulkUpload(file: UploadedCsvFile): Promise<BulkUploadResponseDto> {
        if (!file) {
            throw new BadRequestException("No file uploaded");
        }

        if (!file.originalname.endsWith(".csv") && file.mimetype !== "text/csv") {
            throw new BadRequestException("Only CSV files are allowed");
        }

        const rows = this.parseCSV(file.buffer);

        if (rows.length === 0) {
            throw new BadRequestException("CSV has no data rows");
        }

        if (rows.length > 1000) {
            throw new BadRequestException("CSV exceeds 1000 row limit");
        }

        const invalidRows: string[] = [];
        rows.forEach((row, index) => {
            if (!this.validatePhoneNumber(row.to)) {
                invalidRows.push(`row ${index + 2}: ${row.to}`);
            }
        });

        if (invalidRows.length > 0) {
            throw new BadRequestException(
                `Invalid phone format. Numbers must be E.164 format (+598XXXXXXXX). Invalid rows: ${invalidRows.slice(0, 5).join(", ")}${invalidRows.length > 5 ? "..." : ""}`,
            );
        }

        const notificationsServiceUrl = this.configService.get<string>("NOTIFICATIONS_SERVICE_URL");
        const apiKey = this.configService.get<string>("NOTIFICATIONS_SERVICE_API_KEY");

        if (!notificationsServiceUrl || !apiKey) {
            throw new HttpException(
                "Notifications service not configured",
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        try {
            const form = new FormData();
            form.append("file", file.buffer, {
                filename: file.originalname,
                contentType: file.mimetype || "text/csv",
            });

            const response = await axios.post(
                `${notificationsServiceUrl}/notifications/bulk`,
                form,
                {
                    headers: {
                        "X-Api-Key": apiKey,
                        ...form.getHeaders(),
                    },
                    timeout: 30000,
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                },
            );

            return {
                batchId: response.data.batchId,
                total: response.data.total,
            };
        } catch (error: any) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Error proxying to notifications service";
            throw new HttpException(
                message,
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getBulkStatus(batchId: string): Promise<BulkStatusResponseDto> {
        const notificationsServiceUrl = this.configService.get<string>(
            "NOTIFICATIONS_SERVICE_URL",
        );
        const apiKey = this.configService.get<string>("NOTIFICATIONS_SERVICE_API_KEY");

        if (!notificationsServiceUrl || !apiKey) {
            throw new HttpException(
                "Notifications service not configured",
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        try {
            const response = await axios.get(
                `${notificationsServiceUrl}/notifications/batches/${batchId}`,
                {
                    headers: {
                        "X-Api-Key": apiKey,
                    },
                    timeout: 10000,
                },
            );

            const batch = response.data;
            return {
                batchId: batch._id || batchId,
                status: batch.status?.toLowerCase() || "pending",
                totalRows: batch.totalRows || batch.total || 0,
                processedRows: batch.processedRows || 0,
                successCount: batch.successCount || 0,
                failureCount: batch.failureCount || 0,
            };
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new NotFoundException("Batch not found");
            }
            const message =
                error.response?.data?.message ||
                error.message ||
                "Error fetching batch status";
            throw new HttpException(
                message,
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
        try {
            const notification = await this.notificationRepository.create(
                createNotificationDto,
            );
            return notification;
        } catch (error: any) {
            throw new HttpException(
                error.message || "Error creating notification",
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async findAll(
        page: number,
        limit: number,
        status?: string,
        searchQ?: string,
    ): Promise<{ data: Notification[]; total: number; page: number; limit: number }> {
        try {
            const offset = (page - 1) * limit;
            const [data, total] = await Promise.all([
                this.notificationRepository.findAll(offset, limit, status, searchQ),
                this.notificationRepository.countNotifications(status, searchQ),
            ]);
            return { data, total, page, limit };
        } catch (error: any) {
            throw new HttpException(
                error.message || "Error fetching notifications",
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async findAllWithoutPagination(status?: string): Promise<Notification[]> {
        try {
            return await this.notificationRepository.findAllWithoutPagination(status);
        } catch (error: any) {
            throw new HttpException(
                error.message || "Error fetching notifications",
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async update(
        id: string,
        updateNotificationDto: UpdateNotificationDto,
    ): Promise<Notification> {
        try {
            const notification = await this.notificationRepository.update(
                id,
                updateNotificationDto,
            );

            if (!notification) {
                throw new NotFoundException(`Notification with ID ${id} not found`);
            }

            return notification;
        } catch (error: any) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new HttpException(
                error.message || "Error updating notification",
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async remove(id: string): Promise<{ message: string }> {
        try {
            const notification = await this.notificationRepository.delete(id);

            if (!notification) {
                throw new NotFoundException(`Notification with ID ${id} not found`);
            }

            return { message: "Notification deleted successfully" };
        } catch (error: any) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new HttpException(
                error.message || "Error deleting notification",
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async removeByClientId(clientId: string): Promise<boolean> {
        try {
            const notification = await this.notificationRepository.deleteByClientId(clientId);

            if (!notification) {
                return false;
            }
            return true;
        } catch (error: any) {
            console.log(error);
            return false;
        }
    }
}