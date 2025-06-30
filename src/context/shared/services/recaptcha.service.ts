import { Injectable, BadRequestException } from '@nestjs/common';
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

      // Verificar que la acción coincida
      if (data.action !== expectedAction) {
        console.error(`reCAPTCHA action mismatch. Expected: ${expectedAction}, Got: ${data.action}`);
        return false;
      }

      // Verificar el score (para reCAPTCHA v3)
      if (data.score < this.minScore) {
        console.warn(`reCAPTCHA score too low: ${data.score}. Minimum required: ${this.minScore}`);
        return false;
      }

      console.log(`reCAPTCHA verification successful. Score: ${data.score}, Action: ${data.action}`);
      return true;
    } catch (error) {
      console.error('Error verifying reCAPTCHA:', error);
      return false;
    }
  }
}
