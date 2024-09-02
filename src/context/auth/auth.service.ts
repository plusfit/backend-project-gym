import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import * as jwt from "jsonwebtoken";

import { LoginAuthDto } from "@/src/context/auth/dto/login-auth.dto";
import { RegisterAuthDto } from "@/src/context/auth/dto/register-auth.dto";
import { AUTH_REPOSITORY } from "@/src/context/auth/repositories/auth.repository";

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: any,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterAuthDto) {
    return await this.authRepository.register(registerDto);
  }

  async login(loginDto: LoginAuthDto) {
    try {
      this.validateLogin(loginDto);
      const email = await this.getEmailFromJWTFirebase(loginDto.token);
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

  async getEmailFromJWTFirebase(token: string) {
    try {
      const firebasePublicKeysUrl = this.configService.get(
        "FIREBASE_PUBLIC_KEYS_URL",
      );

      // Obtener las claves públicas desde Firebase
      const response = await axios.get(firebasePublicKeysUrl);
      const publicKeys = response.data;

      // Decodificar el token sin verificar la firma para obtener el kid
      const decodedHeader: any = jwt.decode(token, { complete: true });
      const kid = decodedHeader?.header?.kid;

      if (!kid || !publicKeys[kid]) {
        throw new Error(
          "Invalid token: kid not found or public key is missing",
        );
      }

      // Verificar el token con la clave pública correspondiente
      const decoded = jwt.verify(token, publicKeys[kid]) as jwt.JwtPayload;

      // Validar que venga de Firebase
      if (decoded.iss !== `https://securetoken.google.com/your-project-id`) {
        throw new Error("Token is not from Firebase");
      }

      // Validar que tenga un email
      if (
        !decoded.email ||
        !decoded.firebase ||
        !decoded.firebase.identities?.email?.length
      ) {
        throw new Error("Invalid token: Email not found");
      }

      return decoded.email;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
