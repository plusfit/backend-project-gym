/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import firebaseAdmin from "firebase-admin";
import { Types } from "mongoose";

import { LoginAuthDto } from "@/src/context/auth/dto/login-auth.dto";
import { RefreshTokenAuthDto } from "@/src/context/auth/dto/refresh-token-auth-dto";
import { RegisterAuthDto } from "@/src/context/auth/dto/register-auth.dto";
import { AUTH_REPOSITORY } from "@/src/context/auth/repositories/auth.repository";
import { OnboardingService } from "../onboarding/onboarding.service";
import { GoogleAuthDto } from "@/src/context/auth/dto/google-auth.dto";
import { OrganizationsService } from "../organizations/organizations.service";

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: any,
    private readonly onboardingService: OnboardingService,
    private readonly configService: ConfigService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async register(registerDto: RegisterAuthDto, organizationId?: string) {
    try {
      if (organizationId) {
        const orgExists =
          await this.organizationsService.validateOrganizationExists(
            new Types.ObjectId(organizationId),
          );
        if (!orgExists) {
          throw new UnauthorizedException("Organization not found or inactive");
        }
      }

      return await this.authRepository.register({
        ...registerDto,
        organizationId: organizationId
          ? new Types.ObjectId(organizationId)
          : undefined,
      });
    } catch (error: any) {
      console.log(error);
      throw new UnauthorizedException("Error al registrar, verifique datos");
    }
  }

  async login(loginDto: LoginAuthDto, organizationSlug?: string) {
    try {
      this.validateLogin(loginDto);

      let organization = null;
      if (organizationSlug) {
        organization =
          await this.organizationsService.findBySlug(organizationSlug);
        if (!organization || !organization.isActive) {
          throw new UnauthorizedException("Organization not found or inactive");
        }
      }

      const email = await this.getEmailFromJWTFirebase(loginDto.token);
      const response = await this.authRepository.login(
        email,
        organization?._id,
      );

      const { _doc } = response;

      if (_doc.disabled) {
        throw new UnauthorizedException(
          "Usuario deshabilitado. Contacte al administrador",
        );
      }

      // biome-ignore lint/performance/noDelete: <explanation>
      delete _doc.refreshToken;

      const onboarding = await this.onboardingService.findByUserId(_doc._id);

      _doc.onboardingCompleted = false;

      if (onboarding && onboarding.completed) {
        _doc.onboardingCompleted = true;
      }

      const payload = {
        ..._doc,
        organizationId: _doc.organizationId?.toString(),
      };

      const tokens = this.createToken(payload);

      await this.authRepository.saveRefreshToken(_doc._id, tokens.refreshToken);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        organization: organization
          ? {
              id: organization._id,
              name: organization.name,
              slug: organization.slug,
            }
          : null,
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
      throw new Error("Token is required");
    }
  }

  async getEmailFromJWTFirebase(token: string) {
    try {
      const firebasePublicKeysUrl = this.configService.get(
        "FIREBASE_PUBLIC_KEYS_URL",
      );

      const response = await axios.get(firebasePublicKeysUrl);
      const publicKeys = response.data;

      const decodedHeader: any = jwt.decode(token, { complete: true });
      const kid = decodedHeader?.header?.kid;

      if (!kid || !publicKeys[kid]) {
        throw new Error("Invalid token");
      }

      const decoded = jwt.verify(token, publicKeys[kid]) as jwt.JwtPayload;

      if (decoded.aud !== this.configService.get("AUD")) {
        throw new Error("Token is not from Firebase");
      }

      if (
        !decoded.email ||
        !decoded.firebase ||
        !decoded.firebase.identities?.email?.length
      ) {
        throw new Error("Invalid token");
      }

      return decoded.email;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  createToken(payload: any) {
    const accessSecret = this.configService.get("JWT_ACCESS_SECRET");
    const accessExpiresIn = this.configService.get("JWT_ACCESS_EXPIRES_IN");

    const refreshSecret = this.configService.get<string>("JWT_REFRESH_SECRET");
    if (!refreshSecret) {
      throw new Error("JWT_REFRESH_SECRET is not set in the configuration.");
    }
    const refreshExpiresIn = this.configService.get("JWT_REFRESH_EXPIRES_IN");

    const tokenPayload = {
      userId: payload._id,
      organizationId: payload.organizationId,
      role: payload.role,
      email: payload.email,
      createdAt: Date.now(),
    };

    const accessToken = jwt.sign(tokenPayload, accessSecret, {
      expiresIn: accessExpiresIn,
    });

    const refreshTokenPayload = {
      ...tokenPayload,
    };

    const refreshToken = jwt.sign(refreshTokenPayload, refreshSecret, {
      expiresIn: refreshExpiresIn,
    });

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }

  async refreshToken(refreshToken: RefreshTokenAuthDto) {
    try {
      const _refreshToken = refreshToken.refreshToken;
      const refreshSecret =
        this.configService.get<string>("JWT_REFRESH_SECRET");

      if (!refreshSecret) {
        throw new Error("JWT_REFRESH_SECRET is not set in the configuration.");
      }

      const decoded = jwt.verify(
        _refreshToken,
        refreshSecret,
      ) as jwt.JwtPayload;
      const userId = decoded.userId;

      const storedRefreshToken =
        await this.authRepository.getRefreshToken(userId);

      if (storedRefreshToken !== _refreshToken) {
        throw new Error("Invalid refresh token");
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { exp, iat, ...payloadWithoutExp } = decoded;

      const newTokens = this.createToken(payloadWithoutExp);

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

  async googleLogin(googleAuthDto: GoogleAuthDto, organizationSlug?: string) {
    try {
      if (!googleAuthDto.idToken) {
        throw new Error("Google ID token is required");
      }

      let organization = null;
      if (organizationSlug) {
        organization =
          await this.organizationsService.findBySlug(organizationSlug);
        if (!organization || !organization.isActive) {
          throw new UnauthorizedException("Organization not found or inactive");
        }
      }

      const email = await this.verifyGoogleToken(googleAuthDto.idToken);

      // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
      let client: any;
      try {
        client = await this.authRepository.login(email, organization?._id);
      } catch (error) {
        const registerDto: RegisterAuthDto = {
          email,
        };
        client = await this.authRepository.register({
          ...registerDto,
          organizationId: organization?._id,
        });

        await this.onboardingService.create({
          userId: client._id.toString(),
          step: 1,
          completed: false,
        });
      }

      const { _doc } = client as any;

      if (_doc.disabled) {
        throw new UnauthorizedException(
          "Usuario deshabilitado. Contacte al administrador",
        );
      }

      // biome-ignore lint/performance/noDelete: necesario para eliminar la propiedad
      delete _doc.refreshToken;

      const onboarding = await this.onboardingService.findByUserId(_doc._id);
      _doc.onboardingCompleted = false;

      if (onboarding && onboarding.completed) {
        _doc.onboardingCompleted = true;
      }

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

        await this.authRepository.updateUserInfo(_doc._id, userInfo);
      }

      const payload = {
        ..._doc,
        organizationId: _doc.organizationId?.toString(),
      };

      const tokens = this.createToken(payload);

      await this.authRepository.saveRefreshToken(_doc._id, tokens.refreshToken);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        organization: organization
          ? {
              id: organization._id,
              name: organization.name,
              slug: organization.slug,
            }
          : null,
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
      const auth = firebaseAdmin.auth();
      const decodedToken = await auth.verifyIdToken(idToken);

      if (!decodedToken.email) {
        throw new Error("Invalid email in token");
      }

      return decodedToken.email;
    } catch (error) {
      console.error("Firebase token verification error:", error);
      throw new Error("Error verifying Firebase token");
    }
  }
}
