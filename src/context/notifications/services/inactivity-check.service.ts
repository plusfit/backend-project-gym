import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ClientDocument } from "@/src/context/clients/schemas/client.schema";
import { NotificationsService } from "../notifications.service";
import { NotificationReason, NotificationStatus } from "../schemas/notification.schema";

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
    //CronExpression.EVERY_DAY_AT_1AM
    @Cron(CronExpression.EVERY_30_SECONDS, {
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
                        reason: NotificationReason.INACTIVITY,
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

            // Check for birthdays
            await this.checkBirthdays();

            // Check for first time clients (registered yesterday)
            await this.checkFirstTimeClients();
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
                        reason: NotificationReason.INACTIVITY,
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
     * Check for clients with birthdays today and create notifications
     */
    private async checkBirthdays(): Promise<void> {
        try {
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentDay = now.getDate();

            const clientsWithBirthday = await this.clientModel.find({
                "userInfo.dateBirthday": { $exists: true, $ne: null },
                disabled: { $ne: true },
            });

            const birthdayClients = clientsWithBirthday.filter((client) => {
                if (!client.userInfo?.dateBirthday) return false;
                const birthday = new Date(client.userInfo.dateBirthday);
                return (
                    birthday.getMonth() + 1 === currentMonth &&
                    birthday.getDate() === currentDay
                );
            });

            let birthdayNotificationsCreated = 0;
            let birthdayErrors = 0;

            for (const client of birthdayClients) {
                try {
                    const clientId = (client._id as any).toString();

                    const startOfYear = new Date(now.getFullYear(), 0, 1);
                    const existingNotifications = await this.notificationsService.findAllWithoutPagination();
                    const hasRecentBirthdayNotification = existingNotifications.some(
                        (notification: any) => {
                            const notificationDate = new Date(notification.createdAt);
                            const notificationClientId = notification.clientId?._id?.toString() || notification.clientId?.toString();
                            return (
                                notificationClientId === clientId &&
                                notification.reason === "Cumpleaños" &&
                                notificationDate >= startOfYear
                            );
                        },
                    );

                    if (hasRecentBirthdayNotification) {
                        continue;
                    }

                    await this.notificationsService.create({
                        clientId,
                        name: client.userInfo?.name || client.email || "Cliente sin nombre",
                        reason: NotificationReason.BIRTHDAY,
                        phone: client.userInfo?.phone || "",
                        status: NotificationStatus.PENDING,
                    });

                    birthdayNotificationsCreated++;

                } catch (error) {
                    birthdayErrors++;
                    const clientId = (client._id as any).toString();
                    this.logger.error(
                        `Error creating birthday notification for client ${clientId}`,
                        {
                            error: error instanceof Error ? error.message : String(error),
                            stack: error instanceof Error ? error.stack : undefined,
                        },
                    );
                }
            }

            this.logger.log(
                `Birthday check completed: ${birthdayClients.length} birthdays found, ${birthdayNotificationsCreated} notifications created, ${birthdayErrors} errors`,
            );
        } catch (error) {
            this.logger.error("Error during birthday check", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
        }
    }

    /**
     * Check for clients registered yesterday and create first time notifications
     */
    private async checkFirstTimeClients(): Promise<void> {
        try {
            const now = new Date();

            // Calculate yesterday's date range (start and end of yesterday)
            const yesterdayStart = new Date(now);
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            yesterdayStart.setHours(0, 0, 0, 0);

            const yesterdayEnd = new Date(now);
            yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
            yesterdayEnd.setHours(23, 59, 59, 999);

            this.logger.log(`Checking for clients registered on ${yesterdayStart.toISOString().split('T')[0]}...`);

            // Find clients created yesterday
            const newClients = await this.clientModel.find({
                createdAt: {
                    $gte: yesterdayStart,
                    $lte: yesterdayEnd,
                },
                disabled: { $ne: true },
            });

            let firstTimeNotificationsCreated = 0;
            let firstTimeErrors = 0;

            for (const client of newClients) {
                try {
                    const clientId = (client._id as any).toString();

                    // Check if there's already a first time notification for this client
                    const existingNotifications = await this.notificationsService.findAllWithoutPagination();
                    const hasFirstTimeNotification = existingNotifications.some(
                        (notification: any) => {
                            const notificationClientId = notification.clientId?._id?.toString() || notification.clientId?.toString();
                            return (
                                notificationClientId === clientId &&
                                notification.reason === "Primera vez"
                            );
                        },
                    );

                    if (hasFirstTimeNotification) {
                        this.logger.debug(
                            `Client ${client.userInfo?.name || client.email} already has a first time notification`,
                        );
                        continue;
                    }

                    await this.notificationsService.create({
                        clientId,
                        name: client.userInfo?.name || client.email || "Cliente sin nombre",
                        reason: NotificationReason.FIRST_TIME,
                        phone: client.userInfo?.phone || "",
                        status: NotificationStatus.PENDING,
                    });

                    firstTimeNotificationsCreated++;

                    this.logger.debug(
                        `First time notification created for client ${client.userInfo?.name || client.email}`,
                    );
                } catch (error) {
                    firstTimeErrors++;
                    const clientId = (client._id as any).toString();
                    this.logger.error(
                        `Error creating first time notification for client ${clientId}`,
                        {
                            error: error instanceof Error ? error.message : String(error),
                            stack: error instanceof Error ? error.stack : undefined,
                        },
                    );
                }
            }

            this.logger.log(
                `First time check completed: ${newClients.length} new clients found, ${firstTimeNotificationsCreated} notifications created, ${firstTimeErrors} errors`,
            );
        } catch (error) {
            this.logger.error("Error during first time check", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
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
