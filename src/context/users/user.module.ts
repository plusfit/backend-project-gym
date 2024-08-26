import { Module } from "@nestjs/common";

import { UsersController } from "@/src/context/users/users.controller";

@Module({
  controllers: [UsersController],
})
export class UserModule {}
