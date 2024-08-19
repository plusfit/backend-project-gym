import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SomeService {
  constructor(private configService: ConfigService) {}
}
