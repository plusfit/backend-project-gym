import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class UserInfo extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  age!: number;

  //COMPLETAR DATOS
}

@Schema()
export class Client extends Document {
  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  planId!: string;

  @Prop()
  email!: string;

  @Prop({ type: SchemaFactory.createForClass(UserInfo), required: true })
  userInfo!: UserInfo;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
export type ClientDocument = Client & Document;
