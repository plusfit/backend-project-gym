import {
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { CreateNotificationDto } from "./dto/create-notification.dto";
import { UpdateNotificationDto } from "./dto/update-notification.dto";
import { NOTIFICATION_REPOSITORY } from "./repositories/notifications.repository";
import { Notification } from "./schemas/notification.schema";

@Injectable()
export class NotificationsService {
    constructor(
        @Inject(NOTIFICATION_REPOSITORY)
        private readonly notificationRepository: any,
    ) { }

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

    async findAll(status?: string): Promise<Notification[]> {
        try {
            return await this.notificationRepository.findAll(status);
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
}
