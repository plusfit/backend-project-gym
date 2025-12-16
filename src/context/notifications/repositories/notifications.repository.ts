import { Notification } from "../schemas/notification.schema";

export const NOTIFICATION_REPOSITORY = "NotificationsRepository";

export interface NotificationsRepository {
    create(notification: Notification): Promise<Notification>;
    findAll(offset: number, limit: number, status?: string): Promise<Notification[]>;
    countNotifications(status?: string): Promise<number>;
    findAllWithoutPagination(status?: string): Promise<Notification[]>;
    findById(id: string): Promise<Notification | null>;
    update(id: string, notification: Partial<Notification>): Promise<Notification | null>;
    delete(id: string): Promise<Notification | null>;
}
