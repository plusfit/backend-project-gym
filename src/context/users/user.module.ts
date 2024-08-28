import { Module } from "@nestjs/common";
import { UsersController } from "@/src/context/users/users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UserModule {}
