import { Global, Module } from "@nestjs/common";
import { TenantContextService } from "./services/tenant-context.service";

@Global()
@Module({
  imports: [],
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class SharedModule {}
