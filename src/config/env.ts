import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  yahooAppId: string;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v.trim();
}

export const config: AppConfig = {
  yahooAppId: requireEnv('YAHOO_APP_ID')
};
