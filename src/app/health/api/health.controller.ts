import { Controller, Get, HttpCode } from "@nestjs/common";

@Controller("health")
export class HealthController {
	constructor() {}

	@Get()
	@HttpCode(200)
	run() {
		return { status: "ok" };
	}
}
