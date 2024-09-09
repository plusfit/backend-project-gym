import { Body, Controller, Post } from "@nestjs/common";

import { AuthService } from "@/src/context/auth/auth.service";
import { LoginAuthDto } from "@/src/context/auth/dto/login-auth.dto";
import { RegisterAuthDto } from "@/src/context/auth/dto/register-auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post("register")
  register(@Body() registerDto: RegisterAuthDto) {
    try {
      return this.authService.register(registerDto);
    } catch (error: any) {
      throw new Error(`Error creating client: ${error.message}`);
    }
  }

  @Post("login")
  login(@Body() loginDto: LoginAuthDto) {
    return this.authService.login(loginDto);
  }

  @Post("refresh-token")
  refreshToken(refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }
}
