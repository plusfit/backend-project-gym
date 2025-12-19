export interface InvitationCodeResponse {
    code: string;
    link: string;
}

export interface ValidateInvitationCodeResponse {
    valid: boolean;
}

export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
}

export interface AuthErrorResponse {
    success: boolean;
    error: string;
}
