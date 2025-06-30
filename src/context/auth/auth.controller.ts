import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiTags, ApiResponse } from "@nestjs/swagger";

import { AuthService } from "@/src/context/auth/auth.service";
import { LoginAuthDto } from "@/src/context/auth/dto/login-auth.dto";
import { RefreshTokenAuthDto } from "@/src/context/auth/dto/refresh-token-auth-dto";
import { RegisterAuthDto } from "@/src/context/auth/dto/register-auth.dto";
import { GoogleAuthDto } from "@/src/context/auth/dto/google-auth.dto";
import { RecaptchaGuard, RecaptchaAction } from "@/src/context/shared/guards/recaptcha.guard";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}
	@Post("register")
	@UseGuards(RecaptchaGuard)
	@RecaptchaAction('register')
	@ApiResponse({ status: 201, description: 'User registered successfully.' })
	@ApiResponse({ status: 400, description: 'Invalid input or reCAPTCHA verification failed.' })
	register(@Body() registerDto: RegisterAuthDto) {
		try {
			return this.authService.register(registerDto);
		} catch (error: any) {
			throw new Error(`Error creating client: ${error.message}`);
		}
	}

	@UseGuards(RecaptchaGuard)
	@RecaptchaAction('login')
	@Post("login")
	@ApiResponse({ status: 200, description: 'User logged in successfully.' })
	@ApiResponse({ status: 400, description: 'Invalid credentials or reCAPTCHA verification failed.' })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	login(@Body() loginDto: LoginAuthDto) {
		return this.authService.login(loginDto);
	}

	@Post("refreshToken")
	refreshToken(@Body() refreshToken: RefreshTokenAuthDto) {
		return this.authService.refreshToken(refreshToken);
	}

	@Post("google")
	@UseGuards(RecaptchaGuard)
	@RecaptchaAction('google_register')
	@ApiResponse({ status: 200, description: 'Google login successful.' })
	@ApiResponse({ status: 400, description: 'Invalid Google token or reCAPTCHA verification failed.' })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	googleLogin(@Body() googleAuthDto: GoogleAuthDto) {
		return this.authService.googleLogin(googleAuthDto);
	}
}
