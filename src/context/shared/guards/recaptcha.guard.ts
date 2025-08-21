import { BadRequestException, CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RecaptchaService } from '../services/recaptcha.service';

// Decorador para marcar qué acción de reCAPTCHA se espera
export const RecaptchaAction = (action: string) => SetMetadata('recaptcha-action', action);

@Injectable()
export class RecaptchaGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly recaptchaService: RecaptchaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const action = this.reflector.get<string>('recaptcha-action', context.getHandler());
    
    if (!action) {
      // Si no hay acción definida, no se requiere reCAPTCHA
      return true;
    }

    const { recaptchaToken } = request.body;
    
    // Para el login con Google, el reCAPTCHA es opcional
    if ((action === 'google_login' || action === 'google_register') && !recaptchaToken) {
      return true;
    }
    
    if (!recaptchaToken) {
      throw new BadRequestException('reCAPTCHA token is required');
    }

    const clientIp = request.ip || request.connection.remoteAddress;
    const isValid = await this.recaptchaService.verifyRecaptcha(recaptchaToken, action, clientIp);
    
    if (!isValid) {
      throw new BadRequestException('reCAPTCHA verification failed');
    }

    return true;
  }
}
