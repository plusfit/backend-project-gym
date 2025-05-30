import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { AuthService } from "@/src/context/auth/auth.service";
import { LoginAuthDto } from "@/src/context/auth/dto/login-auth.dto";
import { RefreshTokenAuthDto } from "@/src/context/auth/dto/refresh-token-auth-dto";
import { RegisterAuthDto } from "@/src/context/auth/dto/register-auth.dto";
import { GoogleAuthDto } from "@/src/context/auth/dto/google-auth.dto";
import { JwtAuthGuard } from "@/src/context/shared/guards/jwt-auth.guard";

@ApiTags("auth")
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

  @Post("refreshToken")
  refreshToken(@Body() refreshToken: RefreshTokenAuthDto) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post("google")
  googleLogin(@Body() googleAuthDto: GoogleAuthDto) {
    return this.authService.googleLogin(googleAuthDto);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return this.authService.getUserProfile(req.user.userId);
  }
}
