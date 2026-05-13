import { Controller, Get, Post, Req, Sse } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import axios from "axios";
import { Observable } from "rxjs";

@ApiTags("whatsapp")
@Controller("whatsapp")
export class WhatsAppController {
    constructor(private readonly configService: ConfigService) {}

    @Get("status")
    @ApiOperation({ summary: "Get WhatsApp connection status" })
    @ApiResponse({
        status: 200,
        description: "Returns WhatsApp connection status",
    })
    async getStatus() {
        const notificationsServiceUrl = this.configService.get<string>("NOTIFICATIONS_SERVICE_URL");
        const apiKey = this.configService.get<string>("NOTIFICATIONS_SERVICE_API_KEY");

        if (!notificationsServiceUrl || !apiKey) {
            return {
                status: "disconnected",
                isConnected: false,
                error: "Notifications service not configured",
            };
        }

        try {
            const response = await axios.get(`${notificationsServiceUrl}/auth/whatsapp/status`, {
                headers: { "X-Api-Key": apiKey },
                timeout: 5000,
            });
            return response.data;
        } catch (error: any) {
            return {
                status: "error",
                isConnected: false,
                error: error.message || "Failed to get status",
            };
        }
    }

    @Post("logout")
    @ApiOperation({ summary: "Logout WhatsApp session" })
    @ApiResponse({
        status: 200,
        description: "WhatsApp session logged out successfully",
    })
    async logout() {
        const notificationsServiceUrl = this.configService.get<string>("NOTIFICATIONS_SERVICE_URL");
        const apiKey = this.configService.get<string>("NOTIFICATIONS_SERVICE_API_KEY");

        if (!notificationsServiceUrl || !apiKey) {
            return { message: "Notifications service not configured" };
        }

        try {
            await axios.post(
                `${notificationsServiceUrl}/auth/whatsapp/logout`,
                {},
                {
                    headers: { "X-Api-Key": apiKey },
                    timeout: 5000,
                },
            );
            return { message: "Logged out successfully" };
        } catch (error: any) {
            return { message: "Logout failed: " + (error.message || "Unknown error") };
        }
    }

    @Sse("qr")
    @ApiOperation({ summary: "Get WhatsApp QR code via SSE" })
    qrStream(@Req() req: any): Observable<MessageEvent> {
        console.log("[whatsapp/qr] SSE connection opened. token via query?", !!(req.query as any)?.token);
        const notificationsServiceUrl = this.configService.get<string>("NOTIFICATIONS_SERVICE_URL");
        const apiKey = this.configService.get<string>("NOTIFICATIONS_SERVICE_API_KEY");

        if (!notificationsServiceUrl || !apiKey) {
            console.log("[whatsapp/qr] notifications service NOT configured");
            return new Observable((observer) => {
                observer.next({ data: JSON.stringify({ error: "Notifications service not configured" }) } as MessageEvent);
                observer.complete();
            });
        }
        console.log("[whatsapp/qr] proxying to:", `${notificationsServiceUrl}/auth/whatsapp/qr`);

        return new Observable<MessageEvent>((observer) => {
            let cancelTokenSource = axios.CancelToken.source();
            let retryTimer: NodeJS.Timeout | null = null;
            let stopped = false;

            const connect = async () => {
                try {
                    const response = await axios.get(
                        `${notificationsServiceUrl}/auth/whatsapp/qr`,
                        {
                            headers: {
                                "X-Api-Key": apiKey,
                                Accept: "text/event-stream",
                            },
                            responseType: "stream",
                            cancelToken: cancelTokenSource.token,
                            timeout: 0,
                        },
                    );
                    console.log("[whatsapp/qr] connected to notifications-service. status:", response.status);

                    let buffer = "";
                    response.data.on("data", (chunk: Buffer) => {
                        buffer += chunk.toString("utf8");
                        let idx;
                        while ((idx = buffer.indexOf("\n\n")) !== -1) {
                            const rawEvent = buffer.slice(0, idx);
                            buffer = buffer.slice(idx + 2);
                            const dataLine = rawEvent
                                .split("\n")
                                .find((l) => l.startsWith("data:"));
                            if (!dataLine) continue;
                            const payload = dataLine.replace(/^data:\s?/, "");
                            console.log("[whatsapp/qr] event from notifications-service:", payload.slice(0, 80));
                            observer.next({ data: payload } as MessageEvent);
                        }
                    });
                    response.data.on("end", () => {
                        console.log("[whatsapp/qr] upstream ended, reconnecting in 3s");
                        if (!stopped) retryTimer = setTimeout(connect, 3000);
                    });
                    response.data.on("error", (err: any) => {
                        console.log("[whatsapp/qr] stream error:", err?.message);
                        if (!stopped) retryTimer = setTimeout(connect, 3000);
                    });
                } catch (err: any) {
                    if (axios.isCancel(err)) return;
                    console.log("[whatsapp/qr] connect error:", err?.response?.status, err?.message);
                    if (!stopped) retryTimer = setTimeout(connect, 3000);
                }
            };

            connect();

            return () => {
                stopped = true;
                if (retryTimer) clearTimeout(retryTimer);
                cancelTokenSource.cancel("client disconnected");
            };
        });
    }
}