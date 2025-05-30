import { Prop } from "@nestjs/mongoose";
import { Types } from "mongoose";

export abstract class TenantBaseEntity {
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
