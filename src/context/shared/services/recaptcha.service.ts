import { BadRequestException,Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

@Injectable()
export class RecaptchaService {
  private readonly recaptchaSecretKey: string;
  private readonly minScore: number = 0.5;

  constructor(private readonly configService: ConfigService) {
    this.recaptchaSecretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY') || '';
    if (!this.recaptchaSecretKey) {
      throw new Error('RECAPTCHA_SECRET_KEY is not configured');
    }
  }

  async verifyRecaptcha(token: string, expectedAction: string, clientIp?: string): Promise<boolean> {
    try {
      if (!token || token.trim() === '') {
        console.error('reCAPTCHA token is empty or invalid');
        return false;
      }

      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: this.recaptchaSecretKey,
          response: token,
          ...(clientIp && { remoteip: clientIp }),
        }),
      });

      if (!response.ok) {
        console.error(`reCAPTCHA API request failed with status: ${response.status}`);
        return false;
      }

      const data: RecaptchaResponse = await response.json();

      if (!data.success) {
        console.error('reCAPTCHA verification failed:', data['error-codes']);
        return false;
      }

      // Verificar que la acción coincida (flexibilidad para Google actions)
      const isGoogleAction = expectedAction === 'google_register' || expectedAction === 'google_login';
      const isValidGoogleAction = data.action === 'google_login' || data.action === 'google_register';
      
      if (isGoogleAction && isValidGoogleAction) {
        // Para acciones de Google, aceptamos tanto google_login como google_register
      } else if (data.action !== expectedAction) {
        console.error(`reCAPTCHA action mismatch. Expected: ${expectedAction}, Got: ${data.action}`);
        return false;
      }

      // Verificar el score (para reCAPTCHA v3)
      if (data.score < this.minScore) {
        console.warn(`reCAPTCHA score too low: ${data.score}. Minimum required: ${this.minScore}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verifying reCAPTCHA:', error);
      return false;
    }
  }
}
