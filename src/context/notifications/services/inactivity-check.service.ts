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
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
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

            // Calculate date 1 week ago
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            // Find all active clients with lastAccess older than 1 week
            const inactiveClients = await this.clientModel.find({
                lastAccess: { $lt: oneWeekAgo },
                disabled: { $ne: true }, // Only process active clients
            });

            let notificationsCreated = 0;
            let errors = 0;

            // Process each inactive client
            for (const client of inactiveClients) {
                try {
                    const clientId = (client._id as any).toString();

                    // Check if a notification for inactivity already exists within the last 2 weeks
                    const twoWeeksAgo = new Date();
                    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

                    const existingNotifications = await this.notificationsService.findAll();
                    const hasRecentNotification = existingNotifications.some(
                        (notification: any) => {
                            const notificationDate = new Date(notification.createdAt);
                            // Handle both populated and non-populated clientId
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

                    // Create notification for inactive client
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

                    // Check if a notification for inactivity already exists within the last 2 weeks
                    const twoWeeksAgo = new Date();
                    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

                    const existingNotifications = await this.notificationsService.findAll();
                    const hasRecentNotification = existingNotifications.some(
                        (notification: any) => {
                            const notificationDate = new Date(notification.createdAt);
                            // Handle both populated and non-populated clientId
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
}
