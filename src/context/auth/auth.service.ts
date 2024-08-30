import { Inject, Injectable } from "@nestjs/common";
import * as jwt from "jsonwebtoken";

import { LoginAuthDto } from "@/src/context/auth/dto/login-auth.dto";
import { RegisterAuthDto } from "@/src/context/auth/dto/register-auth.dto";
import { AUTH_REPOSITORY } from "@/src/context/auth/repositories/auth.repository";

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: any,
  ) {}

  async register(registerDto: RegisterAuthDto) {
    return await this.authRepository.register(registerDto);
  }

  async login(loginDto: LoginAuthDto) {
    try {
      this.validateLogin(loginDto);
      const email = this.getEmailFromJWTFirebase(loginDto.token);
      console.log(email);

      return await this.authRepository.login(loginDto);
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  validateLogin(loginDto: LoginAuthDto) {
    if (!loginDto.token) {
      throw new Error("Token is required");
    }
  }

  getEmailFromJWTFirebase(token: string) {
    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload;
      return decoded.email;
    } catch (error: any) {
      throw error.message;
    }
  }
}
