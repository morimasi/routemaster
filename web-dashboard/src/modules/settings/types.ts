export interface InstitutionProfile {
  name: string;
  tenantId: string;
  address: string;
  phone: string;
  email: string;
}

export interface SecurityConfig {
  rlsPolicyActive: boolean;
  mfaEnabled: boolean;
  sessionTimeoutMinutes: number;
}

export interface WebhookConfig {
  url: string;
  events: string[];
  active: boolean;
}
