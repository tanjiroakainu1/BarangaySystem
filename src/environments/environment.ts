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
  /** OpenRouter — loaded from env; never log or display this key in UI */
  openRouter: {
    apiKey: '',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.1-8b-instruct',
    siteUrl: 'http://localhost:4200',
    siteName: 'Barangay System',
  },
};
