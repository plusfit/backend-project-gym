import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { PlansModule } from "@/src/context/plans/plans.module";
import { ClientsModule } from "@/src/context/clients/clients.module";
import { RoutinesModule } from "@/src/context/routines/routines.module";
import { PermissionsGuard } from "@/src/context/shared/guards/permissions/permissions.guard";
import { Client, ClientSchema } from "@/src/context/clients/schemas/client.schema";

import { OrganizationsController } from "./organizations.controller";
import { OrganizationsService } from "./organizations.service";
import {
  Organization,
  OrganizationSchema,
} from "./schemas/organization.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: Client.name, schema: ClientSchema },
    ]),
    forwardRef(() => PlansModule),
    forwardRef(() => ClientsModule),
    forwardRef(() => RoutinesModule),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, PermissionsGuard],
  exports: [OrganizationsService, PermissionsGuard],
})
export class OrganizationsModule {}
