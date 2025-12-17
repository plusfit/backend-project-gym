import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ClientDocument } from "@/src/context/clients/schemas/client.schema";
import { NotificationsService } from "../notifications.service";
import { NotificationStatus } from "../schemas/notification.schema";

@Injectable()
export class InactivityCheckService {
    private readonly logger = new Logger(InactivityCheckService.name);

    constructor(
        @InjectModel("Client")
        private readonly clientModel: Model<ClientDocument>,
        private readonly notificationsService: NotificationsService,
    ) { }

    /**
     * Cron job that runs daily at 00:00 (midnight) Montevideo time to check for inactive clients
     * Creates notifications for clients with lastAccess > 1 week
     * Timezone: America/Montevideo (UTC-3)
     */
    @Cron(CronExpression.EVERY_DAY_AT_1AM, {
        timeZone: "America/Montevideo",
    })
    async checkInactiveClients(): Promise<void> {
        try {
            const now = new Date();
            const montevideoTime = now.toLocaleString("es-UY", {
                timeZone: "America/Montevideo",
                dateStyle: "full",
                timeStyle: "long",
            });

            this.logger.log(
                `Starting inactivity check at ${montevideoTime}...`,
            );

            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const inactiveClients = await this.clientModel.find({
                lastAccess: { $lt: oneWeekAgo },
                disabled: { $ne: true },
            });

            let notificationsCreated = 0;
            let errors = 0;

            for (const client of inactiveClients) {
                try {
                    const clientId = (client._id as any).toString();

                    const twoWeeksAgo = new Date();
                    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

                    const existingNotifications = await this.notificationsService.findAllWithoutPagination();
                    const hasRecentNotification = existingNotifications.some(
                        (notification: any) => {
                            const notificationDate = new Date(notification.createdAt);
                            const notificationClientId = notification.clientId?._id?.toString() || notification.clientId?.toString();
                            return (
                                notificationClientId === clientId &&
                                notification.reason === "Inactividad" &&
                                notificationDate >= twoWeeksAgo
                            );
                        },
                    );

                    if (hasRecentNotification) {
                        this.logger.debug(
                            `Client ${client.userInfo?.name || client.email} already has an inactivity notification within the last 2 weeks`,
                        );
                        continue;
                    }

                    await this.notificationsService.create({
                        clientId,
                        name: client.userInfo?.name || client.email || "Cliente sin nombre",
                        reason: "Inactividad",
                        phone: client.userInfo?.phone || "",
                        status: NotificationStatus.PENDING,
                    });

                    notificationsCreated++;

                    const daysSinceLastAccess = Math.floor(
                        (now.getTime() - (client.lastAccess?.getTime() || 0)) /
                        (1000 * 60 * 60 * 24),
                    );

                    this.logger.debug(
                        `Notification created for client ${client.userInfo?.name || client.email} (${daysSinceLastAccess} days inactive)`,
                    );
                } catch (error) {
                    errors++;
                    const clientId = (client._id as any).toString();
                    this.logger.error(
                        `Error creating notification for client ${clientId}`,
                        {
                            error: error instanceof Error ? error.message : String(error),
                            stack: error instanceof Error ? error.stack : undefined,
                        },
                    );
                }
            }

            this.logger.log(
                `Inactivity check completed: ${inactiveClients.length} inactive clients found, ${notificationsCreated} notifications created, ${errors} errors`,
            );
        } catch (error) {
            this.logger.error("Error during inactivity check", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
        }
    }

    /**
     * Manual method to check inactive clients - useful for testing or manual operations
     */
    async manualCheck(): Promise<{
        inactiveClientsFound: number;
        notificationsCreated: number;
        errors: number;
    }> {
        try {
            this.logger.log("Manual inactivity check triggered");

            const now = new Date();
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const inactiveClients = await this.clientModel.find({
                lastAccess: { $lt: oneWeekAgo },
                disabled: { $ne: true },
            });

            let notificationsCreated = 0;
            let errors = 0;

            for (const client of inactiveClients) {
                try {
                    const clientId = (client._id as any).toString();

                    const twoWeeksAgo = new Date();
                    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

                    const existingNotifications = await this.notificationsService.findAllWithoutPagination();
                    const hasRecentNotification = existingNotifications.some(
                        (notification: any) => {
                            const notificationDate = new Date(notification.createdAt);
                            const notificationClientId = notification.clientId?._id?.toString() || notification.clientId?.toString();
                            return (
                                notificationClientId === clientId &&
                                notification.reason === "Inactividad" &&
                                notificationDate >= twoWeeksAgo
                            );
                        },
                    );

                    if (hasRecentNotification) {
                        continue;
                    }

                    await this.notificationsService.create({
                        clientId,
                        name: client.userInfo?.name || client.email || "Cliente sin nombre",
                        reason: "Inactividad",
                        phone: client.userInfo?.phone || "",
                        status: NotificationStatus.PENDING,
                    });

                    notificationsCreated++;
                } catch (error) {
                    errors++;
                    const clientId = (client._id as any).toString();
                    this.logger.error(
                        `Error creating notification for client ${clientId}`,
                        error,
                    );
                }
            }

            this.logger.log(
                `Manual check completed: ${inactiveClients.length} inactive clients, ${notificationsCreated} notifications created`,
            );

            return {
                inactiveClientsFound: inactiveClients.length,
                notificationsCreated,
                errors,
            };
        } catch (error) {
            this.logger.error("Error during manual inactivity check", error);
            throw error;
        }
    }

    /**
     * Cron job that runs daily at 02:00 AM Montevideo time to delete old notifications
     * Deletes notifications older than 2 weeks
     * Timezone: America/Montevideo (UTC-3)
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
        timeZone: "America/Montevideo",
    })
    async deleteOldNotifications(): Promise<void> {
        try {
            const now = new Date();
            const montevideoTime = now.toLocaleString("es-UY", {
                timeZone: "America/Montevideo",
                dateStyle: "full",
                timeStyle: "long",
            });

            this.logger.log(
                `Starting old notifications cleanup at ${montevideoTime}...`,
            );

            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

            // Get all notifications older than 2 weeks
            const oldNotifications = await this.notificationsService.findAllWithoutPagination();
            const notificationsToDelete = oldNotifications.filter(
                (notification: any) => new Date(notification.createdAt) < twoWeeksAgo
            );

            let deletedCount = 0;
            let errors = 0;

            for (const notification of notificationsToDelete) {
                try {
                    const notificationId = (notification._id as any).toString();
                    await this.notificationsService.remove(notificationId);
                    deletedCount++;
                } catch (error) {
                    errors++;
                    this.logger.error(
                        `Error deleting notification ${notification._id}`,
                        {
                            error: error instanceof Error ? error.message : String(error),
                            stack: error instanceof Error ? error.stack : undefined,
                        },
                    );
                }
            }

            this.logger.log(
                `Old notifications cleanup completed: ${notificationsToDelete.length} notifications found, ${deletedCount} deleted, ${errors} errors`,
            );
        } catch (error) {
            this.logger.error("Error during old notifications cleanup", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
        }
    }

    /**
     * Manual method to delete old notifications - useful for testing or manual operations
     */
    async manualDeleteOldNotifications(): Promise<{
        oldNotificationsFound: number;
        deletedCount: number;
        errors: number;
    }> {
        try {
            this.logger.log("Manual old notifications cleanup triggered");

            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

            const oldNotifications = await this.notificationsService.findAllWithoutPagination();
            const notificationsToDelete = oldNotifications.filter(
                (notification: any) => new Date(notification.createdAt) < twoWeeksAgo
            );

            let deletedCount = 0;
            let errors = 0;

            for (const notification of notificationsToDelete) {
                try {
                    const notificationId = (notification._id as any).toString();
                    await this.notificationsService.remove(notificationId);
                    deletedCount++;
                } catch (error) {
                    errors++;
                    this.logger.error(
                        `Error deleting notification ${(notification._id as any).toString()}`,
                        error,
                    );
                }
            }

            this.logger.log(
                `Manual cleanup completed: ${notificationsToDelete.length} old notifications, ${deletedCount} deleted`,
            );

            return {
                oldNotificationsFound: notificationsToDelete.length,
                deletedCount,
                errors,
            };
        } catch (error) {
            this.logger.error("Error during manual old notifications cleanup", error);
            throw error;
        }
    }
}
