import {
    BadRequestException,
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import axios from "axios";
import FormData from "form-data";
import { Model } from "mongoose";

import { parseCsvRecords } from "@/src/context/shared/utils/csv.utils";
import {
    interpolateName,
    NAME_TOKEN,
    normalizeWhatsAppMessage,
    toUruguayE164,
} from "@/src/context/shared/utils/whatsapp-message.utils";

import { BulkSendDto, BulkSendResponse, SkippedRecipient } from "./dto/bulk-send.dto";
import { TestSendDto, TestSendResponse } from "./dto/test-send.dto";
import { BulkStatusResponseDto } from "./dto/bulk-status.dto";
import { BulkUploadResponseDto } from "./dto/bulk-upload.dto";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { UpdateNotificationDto } from "./dto/update-notification.dto";
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
        @InjectModel("Client")
        private readonly clientModel: Model<any>,
    ) {}

    /**
     * Sends one message to a list of selected clients without any file.
     *
     * This owns the whole resolution step: ids come from the dashboard, phones
     * come from the database. Clients that cannot be reached are dropped and
     * reported by name — the notifications service rejects an entire batch on
     * the first unusable phone, so one bad record would otherwise kill the
     * whole campaign.
     */
    async bulkSend(dto: BulkSendDto): Promise<BulkSendResponse> {
        const { url, apiKey } = this.requireNotificationsServiceConfig();

        const clients = await this.clientModel
            .find({ _id: { $in: dto.clientIds } })
            .exec();
        const byId = new Map(clients.map((client: any) => [String(client._id), client]));

        const recipients: { phone: string; name: string }[] = [];
        const skipped: SkippedRecipient[] = [];
        const seenPhones = new Set<string>();

        for (const clientId of dto.clientIds) {
            const client = byId.get(clientId);

            if (!client) {
                skipped.push({ clientId, name: null, reason: "not_found" });
                continue;
            }

            const name = client.userInfo?.name || client.email || null;
            const rawPhone = client.userInfo?.phone;

            if (!rawPhone) {
                skipped.push({ clientId, name, reason: "no_phone" });
                continue;
            }

            const phone = toUruguayE164(rawPhone);
            if (!phone) {
                skipped.push({ clientId, name, reason: "invalid_phone" });
                continue;
            }

            // Two clients sharing a handset would get the campaign twice.
            if (seenPhones.has(phone)) {
                skipped.push({ clientId, name, reason: "duplicate_phone" });
                continue;
            }

            seenPhones.add(phone);
            recipients.push({ phone, name: name ?? "" });
        }

        if (recipients.length === 0) {
            throw new BadRequestException(
                "No reachable recipients: every selected client is missing a valid phone",
            );
        }

        // {nombre} switches the payload to per-recipient items with the name
        // already interpolated: the notifications service only knows phones,
        // so names can never be resolved further downstream than here.
        const template = normalizeWhatsAppMessage(dto.message);
        const payload = template.includes(NAME_TOKEN)
            ? {
                  items: recipients.map(({ phone, name }) => ({
                      to: phone,
                      message: interpolateName(template, name),
                  })),
              }
            : { to: recipients.map(({ phone }) => phone), message: template };

        try {
            const response = await axios.post(`${url}/notifications/bulk-direct`, payload, {
                headers: { "X-Api-Key": apiKey },
                timeout: 30000,
            });

            return {
                batchId: response.data.batchId,
                total: response.data.total,
                requested: dto.clientIds.length,
                skipped,
            };
        } catch (error: any) {
            throw this.toProxyException(error, "Error enqueuing bulk send");
        }
    }

    /**
     * Sends the campaign body to one phone — the admin's — through the
     * individual send endpoint. Same normalization as the real bulk, so what
     * arrives on the test handset is byte-for-byte what clients would get.
     */
    async testSend(dto: TestSendDto): Promise<TestSendResponse> {
        const { url, apiKey } = this.requireNotificationsServiceConfig();

        const phone = toUruguayE164(dto.phone);
        if (!phone) {
            throw new BadRequestException(
                "Invalid phone: expected an Uruguayan mobile number (e.g. 099123456)",
            );
        }

        try {
            const response = await axios.post(
                `${url}/notifications/send`,
                {
                    channel: "whatsapp",
                    to: phone,
                    message: normalizeWhatsAppMessage(dto.message),
                },
                { headers: { "X-Api-Key": apiKey }, timeout: 15000 },
            );

            return {
                jobId: response.data.jobId,
                status: response.data.status,
                scheduledFor: response.data.scheduledFor,
            };
        } catch (error: any) {
            throw this.toProxyException(error, "Error sending test message");
        }
    }

    private requireNotificationsServiceConfig() {
        const url = this.configService.get<string>("NOTIFICATIONS_SERVICE_URL");
        const apiKey = this.configService.get<string>("NOTIFICATIONS_SERVICE_API_KEY");

        if (!url || !apiKey) {
            throw new HttpException(
                "Notifications service not configured",
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return { url, apiKey };
    }

    /**
     * Keeps the reason the notifications service gave us. axios replaces it
     * with a generic "Request failed with status code 401", which is what made
     * an api key scope mismatch undiagnosable from the dashboard.
     */
    private toProxyException(error: any, fallback: string) {
        const message = error.response?.data?.message || error.message || fallback;

        return new HttpException(
            message,
            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }

    private parseCSV(buffer: Buffer): CsvRow[] {
        // Quote-aware on purpose: a WhatsApp message keeps its line breaks
        // inside one quoted field, so splitting on every "\n" would read the
        // second line of a message as a row with no comma and reject the file.
        const records = parseCsvRecords(buffer.toString("utf-8"));

        if (records.length === 0) {
            throw new BadRequestException("File is empty");
        }

        const header = records[0].map((column) => column.trim().toLowerCase());
        const toIndex = header.indexOf("to");
        const messageIndex = header.indexOf("message");

        if (toIndex === -1 || messageIndex === -1) {
            throw new BadRequestException(
                `Missing required column. CSV must have 'to' and 'message' columns. Found: ${header.join(",")}`,
            );
        }

        return records.slice(1).map((record, index) => {
            const to = (record[toIndex] ?? "").trim();
            // The message keeps its own whitespace: it is the body that ships.
            const message = record[messageIndex] ?? "";

            if (!to || !message.trim()) {
                throw new BadRequestException(
                    `Invalid row ${index + 1}: expected a phone and a message`,
                );
            }

            return { to, message };
        });
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