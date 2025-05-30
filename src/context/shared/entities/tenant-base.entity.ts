import { Prop } from "@nestjs/mongoose";
import { Types } from "mongoose";

export abstract class TenantBaseEntity {
  _id?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: "Organization",
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;
}

// Type helpers para separar concerns de dominio e infraestructura
export type EntityId = string | Types.ObjectId;

export interface DocumentMethods {
  toObject(): any;
}

export type EntityDocument<T> = T & DocumentMethods & { _id: Types.ObjectId };
