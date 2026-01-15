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

    async findAll(offset: number, limit: number, status?: string, searchQ?: string): Promise<Notification[]> {
        const filter: any = {};

        if (status && status !== "ALL") {
            filter.status = status;
        }

        if (searchQ) {
            filter.name = { $regex: searchQ, $options: "i" };
        }

        return await this.notificationModel
            .find(filter)
            .populate("clientId", "name email")
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .exec();
    }

    async countNotifications(status?: string, searchQ?: string): Promise<number> {
        const filter: any = {};

        if (status && status !== "ALL") {
            filter.status = status;
        }

        if (searchQ) {
            filter.name = { $regex: searchQ, $options: "i" };
        }

        return await this.notificationModel.countDocuments(filter).exec();
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

    async findAllWithoutPagination(status?: string): Promise<Notification[]> {
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

    async delete(id: string): Promise<Notification | null> {
        const notification = await this.notificationModel.findById(id).exec();
        if (!notification) {
            return null;
        }
        await this.notificationModel.findByIdAndDelete(id).exec();
        return notification;
    }

    async deletePendingByClientId(clientId: string): Promise<void> {
        await this.notificationModel.deleteMany({
            clientId,
            status: "PENDING"
        }).exec();
    }
}
