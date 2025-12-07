import { Notification } from "../schemas/notification.schema";

export const NOTIFICATION_REPOSITORY = "NotificationsRepository";

export interface NotificationsRepository {
    create(notification: Notification): Promise<Notification>;
    findAll(): Promise<Notification[]>;
    findById(id: string): Promise<Notification | null>;
    update(id: string, notification: Partial<Notification>): Promise<Notification | null>;
}
