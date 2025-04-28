/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import jwt from "jsonwebtoken";

import { LoginAuthDto } from "@/src/context/auth/dto/login-auth.dto";
import { RefreshTokenAuthDto } from "@/src/context/auth/dto/refresh-token-auth-dto";
import { RegisterAuthDto } from "@/src/context/auth/dto/register-auth.dto";
import { AUTH_REPOSITORY } from "@/src/context/auth/repositories/auth.repository";
import { OnboardingService } from "../onboarding/onboarding.service";

@Injectable()
export class AuthService {
	constructor(
		@Inject(AUTH_REPOSITORY)
		private readonly authRepository: any,
		private readonly onboardingService: OnboardingService,
		private readonly configService: ConfigService,
	) {}

	async register(registerDto: RegisterAuthDto) {
		try {
			return await this.authRepository.register(registerDto);
		} catch (error: any) {
			console.log(error);
			throw new UnauthorizedException("Error al registrar, verifique datos");
		}
	}

	async login(loginDto: LoginAuthDto) {
		try {
			this.validateLogin(loginDto);
			//obtengo el mail
			const email = await this.getEmailFromJWTFirebase(loginDto.token);
			const response = await this.authRepository.login(email);
			//me quedo con lo importante
			const { _doc } = response;

			//elimino el refresh tokenS
			delete _doc.refreshToken;

			const onboarding = await this.onboardingService.findByUserId(_doc._id);

			_doc.onboardingCompleted = false;

			//verifico si el onboarding esta completo
			if (onboarding && onboarding.completed) {
				_doc.onboardingCompleted = true;
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
			throw new Error("Token is required");
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
				throw new Error("Invalid token");
			}

			//Verificar el token con la clave publica
			const decoded = jwt.verify(token, publicKeys[kid]) as jwt.JwtPayload;

			//Validar que venga de Firebase
			if (decoded.aud !== this.configService.get("AUD")) {
				//dtf-central a modo de prueba
				throw new Error("Token is not from Firebase");
			}

			//Valido que tenga un email
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
		//género el accessToken y el refreshToken con los secrets del .env
		const accessSecret = this.configService.get("JWT_ACCESS_SECRET");
		const accessExpiresIn = this.configService.get("JWT_ACCESS_EXPIRES_IN");

		const refreshSecret = this.configService.get<string>("JWT_REFRESH_SECRET");
		if (!refreshSecret) {
			throw new Error("JWT_REFRESH_SECRET is not set in the configuration.");
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

	async refreshToken(refreshToken: RefreshTokenAuthDto) {
		try {
			const _refreshToken = refreshToken.refreshToken;
			const refreshSecret =
				this.configService.get<string>("JWT_REFRESH_SECRET");

			if (!refreshSecret) {
				throw new Error("JWT_REFRESH_SECRET is not set in the configuration.");
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
				throw new Error("Invalid refresh token");
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
}
