/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import firebaseAdmin from "firebase-admin";
import jwt from "jsonwebtoken";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { InvitationCode } from "./schemas/invitation-code.schema";

import { GoogleAuthDto } from "@/src/context/auth/dto/google-auth.dto";
import { InternalRegisterAuthDto } from "@/src/context/auth/dto/internal-register-auth.dto";
import { LoginAuthDto } from "@/src/context/auth/dto/login-auth.dto";
import { RefreshTokenAuthDto } from "@/src/context/auth/dto/refresh-token-auth-dto";
import { RegisterAuthDto } from "@/src/context/auth/dto/register-auth.dto";
import { AUTH_REPOSITORY } from "@/src/context/auth/repositories/auth.repository";

import { ClientsService } from "../clients/clients.service";
import { OnboardingService } from "../onboarding/onboarding.service";
import {
  InvitationCodeResponse,
  TokenResponse,
  ValidateInvitationCodeResponse,
  AuthErrorResponse
} from "./interfaces/auth.interfaces";

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: any,
    private readonly onboardingService: OnboardingService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => ClientsService))
    private readonly clientsService: ClientsService,
    @InjectModel(InvitationCode.name) private readonly invitationCodeModel: Model<InvitationCode>,
  ) { }

  async register(registerDto: RegisterAuthDto) {
    try {
      // Handle password if provided
      if (registerDto.password) {
        // Store original password for potential admin access
        const originalPassword = registerDto.password;


        // Add plain password to the DTO
        (registerDto as any).plainPassword = originalPassword;
      }
      const result = await this.authRepository.register(registerDto);

      // Mark invitation code as used
      await this.consumeInvitationCode(registerDto.invitationCode, result._id.toString());

      return result;
    } catch (error: any) {
      if (error instanceof UnauthorizedException || error.message.includes("invitation code")) {
        throw error;
      }
      throw new UnauthorizedException("Error al registrar, verifique datos");
    }
  }

  async generateInvitationCode(): Promise<InvitationCodeResponse> {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const appUrl = this.configService.get("APP_URL") || "https://plusfit.uy";

    await this.invitationCodeModel.create({
      code,
      isUsed: false,
    });

    return {
      code,
      link: `${appUrl}/registro?code=${code}`,
    };
  }

  async validateInvitationCode(code: string): Promise<ValidateInvitationCodeResponse> {
    const invitation = await this.invitationCodeModel.findOne({ code, isUsed: false });
    return { valid: !!invitation };
  }

  async getCurrentInvitationCode(): Promise<InvitationCodeResponse | null> {
    const invitation = await this.invitationCodeModel.findOne({ isUsed: false }).sort({ createdAt: -1 });
    if (!invitation) return null;

    const appUrl = this.configService.get("APP_URL") || "https://plusfit.uy";
    return {
      code: invitation.code,
      link: `${appUrl}/registro?code=${invitation.code}`,
    };
  }

  async consumeInvitationCode(code: string, userId: string): Promise<void> {
    const invitation = await this.invitationCodeModel.findOne({ code, isUsed: false });
    if (!invitation) {
      throw new UnauthorizedException("Invalid or used invitation code");
    }

    invitation.isUsed = true;
    invitation.usedBy = userId;
    invitation.usedAt = new Date();
    await invitation.save();
  }

  async login(loginDto: LoginAuthDto) {
    try {
      this.validateLogin(loginDto);
      //obtengo el mail
      const email = await this.getEmailFromJWTFirebase(loginDto.token);
      const response = await this.authRepository.login(email);

      //me quedo con lo importante
      const { _doc } = response;

      if (_doc.disabled) {
        throw new UnauthorizedException(
          "Usuario deshabilitado. Contacte al administrador",
        );
      }

      if (!loginDto.password) {
        loginDto.password = "";
      }

      // Verificar y actualizar contraseña si es necesario
      if (loginDto.password || loginDto.password === "") {
        await this.checkAndUpdatePassword(_doc._id, loginDto.password);
      }

      //elimino el refresh tokenS
      // biome-ignore lint/performance/noDelete: <explanation>
      delete _doc.refreshToken;

      const onboarding = await this.onboardingService.findByUserId(_doc._id);

      //verifico si el onboarding esta completo
      if (onboarding && onboarding.completed) {
        _doc.isOnboardingCompleted = true;
      }

      const payload = {
        ..._doc,
      };
      //genero los tokens
      const tokens = this.createToken(payload);

      //guardo el refreshToken en la base de datos
      await this.authRepository.saveRefreshToken(_doc._id, tokens.refreshToken);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error: any) {
      console.log(error);
      throw new UnauthorizedException(
        "Error al iniciar sesión, verifique datos",
      );
    }
  }

  validateLogin(loginDto: LoginAuthDto) {
    if (!loginDto.token) {
      throw new Error("Token es requerido");
    }
  }

  async getEmailFromJWTFirebase(token: string) {
    try {
      const firebasePublicKeysUrl = this.configService.get(
        "FIREBASE_PUBLIC_KEYS_URL",
      );

      //Obtener claves publicas de Firebase
      const response = await axios.get(firebasePublicKeysUrl);
      const publicKeys = response.data;

      //Decodificar token sin verificar la firma para obtener el kid
      const decodedHeader: any = jwt.decode(token, { complete: true });
      const kid = decodedHeader?.header?.kid;


      if (!kid || !publicKeys[kid]) {
        throw new Error("Token inválido");
      }

      //Verificar el token con la clave publica
      const decoded = jwt.verify(token, publicKeys[kid]) as jwt.JwtPayload;

      //Validar que venga de Firebase
      if (decoded.aud !== this.configService.get("AUD")) {
        //dtf-central a modo de prueba
        throw new Error("Token no es de Firebase");
      }

      //Valido que tenga un email
      if (
        !decoded.email ||
        !decoded.firebase ||
        !decoded.firebase.identities?.email?.length
      ) {
        throw new Error("Token inválido");
      }

      return decoded.email;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  createToken(payload: any): TokenResponse {
    //género el accessToken y el refreshToken con los secrets del .env
    const accessSecret = this.configService.get("JWT_ACCESS_SECRET");
    const accessExpiresIn = this.configService.get("JWT_ACCESS_EXPIRES_IN");

    const refreshSecret = this.configService.get<string>("JWT_REFRESH_SECRET");
    if (!refreshSecret) {
      throw new Error("JWT_REFRESH_SECRET no está configurado.");
    }
    const refreshExpiresIn = this.configService.get("JWT_REFRESH_EXPIRES_IN");

    const tokenPayload = {
      ...payload,
      createdAt: Date.now(),
    };

    const accessToken = jwt.sign(tokenPayload, accessSecret, {
      expiresIn: accessExpiresIn,
    });

    const refreshTokenPayload = {
      ...payload,
      createdAt: Date.now(),
    };

    const refreshToken = jwt.sign(refreshTokenPayload, refreshSecret, {
      expiresIn: refreshExpiresIn,
    });

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }

  async refreshToken(refreshToken: RefreshTokenAuthDto): Promise<TokenResponse | AuthErrorResponse> {
    try {
      const _refreshToken = refreshToken.refreshToken;
      const refreshSecret =
        this.configService.get<string>("JWT_REFRESH_SECRET");

      if (!refreshSecret) {
        throw new Error("JWT_REFRESH_SECRET no está configurado.");
      }

      //verifico y decodifico el refresh token
      const decoded = jwt.verify(
        _refreshToken,
        refreshSecret,
      ) as jwt.JwtPayload;
      const userId = decoded._id;

      //obtengo el refresh token almacenado del usuario
      const storedRefreshToken =
        await this.authRepository.getRefreshToken(userId);

      if (storedRefreshToken !== _refreshToken) {
        throw new Error("Token de actualización inválido");
      }

      // elimino los campos exp e iat para que se generen de nuevo a lo que no uso las variables tengo que comentarlas con eslint
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { exp, iat, ...payloadWithoutExp } = decoded;

      // Genero nuevos tokens
      const newTokens = this.createToken(payloadWithoutExp);

      //guardo el nuevo refresh token
      await this.authRepository.saveRefreshToken(
        userId,
        newTokens.refreshToken,
      );

      return {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async googleLogin(googleAuthDto: GoogleAuthDto) {
    try {
      debugger
      if (!googleAuthDto.idToken) {
        throw new Error("Token de Google ID es requerido");
      }

      // Verificar el token de Google y obtener el email
      const email = await this.verifyGoogleToken(googleAuthDto.idToken);

      // Buscar usuario por email
      // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
      let client: any;
      try {
        client = await this.authRepository.login(email);
      } catch (error) {
        // Si el usuario no existe, lo registramos automáticamente
        const registerDto: InternalRegisterAuthDto = {
          email,
        };
        client = await this.authRepository.register(registerDto);

        // Crear el registro de onboarding para el nuevo usuario
        await this.onboardingService.create({
          userId: client._id.toString(),
          step: 1,
          completed: false,
        });
      }

      // Extraemos la información que necesitamos
      const { _doc } = client as any;

      if (_doc.disabled) {
        throw new UnauthorizedException(
          "Usuario deshabilitado. Contacte al administrador",
        );
      }

      // biome-ignore lint/performance/noDelete: necesario para eliminar la propiedad
      delete _doc.refreshToken;

      // Verificamos el estado del onboarding
      const onboarding = await this.onboardingService.findByUserId(_doc._id);
      _doc.isOnboardingCompleted = false;

      if (onboarding && onboarding.completed) {
        _doc.isOnboardingCompleted = true;
      }

      // Si hay nombre o avatar en el DTO y el usuario no tiene esta información,
      // actualizamos el userInfo
      if (
        (googleAuthDto.name || googleAuthDto.avatarUrl) &&
        !_doc.userInfo?.name
      ) {
        const userInfo = _doc.userInfo || {};

        if (googleAuthDto.name) {
          userInfo.name = googleAuthDto.name;
        }

        if (googleAuthDto.avatarUrl) {
          userInfo.avatarUrl = googleAuthDto.avatarUrl;
        }

        // Actualizar el usuario con la información de Google
        await this.authRepository.updateUserInfo(_doc._id, userInfo);
      }

      const payload = {
        ..._doc,
      };

      // Generar tokens
      const tokens = this.createToken(payload);

      // Guardar refresh token
      await this.authRepository.saveRefreshToken(_doc._id, tokens.refreshToken);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      console.error("Google login error:", error);
      throw new UnauthorizedException(
        "Error al iniciar sesión con Google, verifique su cuenta",
      );
    }
  }

  async verifyGoogleToken(idToken: string): Promise<string> {
    try {
      // Verificar el token usando Firebase Admin SDK
      const auth = firebaseAdmin.auth();
      const decodedToken = await auth.verifyIdToken(idToken);

      // Verificar que el token tenga un email
      if (!decodedToken.email) {
        throw new Error("Email inválido en token");
      }

      return decodedToken.email;
    } catch (error) {
      console.error("Firebase token verification error:", error);
      throw new Error("Error verifying Firebase token");
    }
  }

  private async checkAndUpdatePassword(
    userId: string,
    plainPassword: string,
  ): Promise<void> {
    try {
      // Obtener la contraseña actual del usuario
      const currentPassword =
        await this.clientsService.getClientPlainPassword(userId);

      // Si no hay contraseña guardada, guardar la nueva
      if (!currentPassword) {
        await this.authRepository.updatePlainPassword(userId, plainPassword);
        return;
      }

      // Si la contraseña es diferente a la actual, actualizar
      if (currentPassword !== plainPassword) {
        await this.authRepository.updatePlainPassword(userId, plainPassword);
      }
    } catch (error: any) {
      console.error("Error checking and updating password:", error);
      // No lanzamos el error para no interrumpir el login si hay problemas con la contraseña
    }
  }
}
