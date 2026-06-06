import { envSecrets } from './env.secrets';

export const environment = {
  production: false,
  supabase: {
    url: 'https://uqdaicrtspezrxqasmfx.supabase.co',
    anonKey: 'sb_publishable_9ZY9kvmdY1OVZ-J_IUOUgQ_-tfhZj9p',
  },
  database: {
    host: 'db.uqdaicrtspezrxqasmfx.supabase.co',
    port: 5432,
    name: 'postgres',
    connectionUrl: 'postgresql://postgres:[YOUR-PASSWORD]@db.uqdaicrtspezrxqasmfx.supabase.co:5432/postgres',
  },
  /** OpenRouter — apiKey loaded from .env via scripts/sync-env.js */
  openRouter: {
    apiKey: envSecrets.openRouterApiKey,
    baseUrl: 'https://openrouter.ai/api/v1',
    model: envSecrets.openRouterModel,
    siteUrl: 'http://localhost:4200',
    siteName: 'Barangay System',
  },
};
