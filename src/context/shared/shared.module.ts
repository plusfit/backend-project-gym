import { Global, Module } from "@nestjs/common";
import { TenantContextService } from "./services/tenant-context.service";
import { OrganizationsModule } from "../organizations/organizations.module";

@Global()
@Module({
  imports: [OrganizationsModule],
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class SharedModule {}
