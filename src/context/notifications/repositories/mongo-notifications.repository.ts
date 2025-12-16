import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Notification } from "../schemas/notification.schema";
import { NotificationsRepository } from "./notifications.repository";

@Injectable()
export class MongoNotificationsRepository implements NotificationsRepository {
    constructor(
        @InjectModel(Notification.name)
        private readonly notificationModel: Model<Notification>,
    ) { }

    async create(notification: Notification): Promise<Notification> {
        const newNotification = new this.notificationModel(notification);
        return await newNotification.save();
    }

    async findAll(status?: string): Promise<Notification[]> {
        const filter: any = {};
        
        if (status && status !== "ALL") {
            filter.status = status;
        }
        
        return await this.notificationModel
            .find(filter)
            .populate("clientId", "name email")
            .sort({ createdAt: -1 })
            .exec();
    }

    async findById(id: string): Promise<Notification | null> {
        return await this.notificationModel
            .findById(id)
            .populate("clientId", "name email")
            .exec();
    }

    async update(
        id: string,
        notification: Partial<Notification>,
    ): Promise<Notification | null> {
        return await this.notificationModel
            .findByIdAndUpdate(id, notification, { new: true })
            .populate("clientId", "name email")
            .exec();
    }
}
