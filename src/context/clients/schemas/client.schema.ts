import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class UserInfo extends Document {
  @Prop()
  name?: string;

  @Prop()
  age?: number;

  //COMPLETAR CON OTROS DATOS
}

@Schema()
export class Client extends Document {
  @Prop({ default: "User" })
  role!: string;

  @Prop()
  planId?: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ type: SchemaFactory.createForClass(UserInfo) })
  userInfo?: UserInfo;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
export type ClientDocument = Client & Document;
