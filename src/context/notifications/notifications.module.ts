import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { Client, ClientSchema } from "@/src/context/clients/schemas/client.schema";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { NOTIFICATION_REPOSITORY } from "./repositories/notifications.repository";
import { MongoNotificationsRepository } from "./repositories/mongo-notifications.repository";
import {
    Notification,
    NotificationSchema,
} from "./schemas/notification.schema";
import { InactivityCheckService } from "./services/inactivity-check.service";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Notification.name, schema: NotificationSchema },
            { name: Client.name, schema: ClientSchema },
        ]),
    ],
    controllers: [NotificationsController],
    providers: [
        NotificationsService,
        InactivityCheckService,
        {
            provide: NOTIFICATION_REPOSITORY,
            useClass: MongoNotificationsRepository,
        },
    ],
    exports: [MongooseModule, NOTIFICATION_REPOSITORY, NotificationsService, InactivityCheckService],
})
export class NotificationsModule { }
