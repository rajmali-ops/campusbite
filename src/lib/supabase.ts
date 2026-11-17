import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project')
  );
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!client) {
    const isServer = typeof window === 'undefined';
    const options: any = {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    };

    if (isServer) {
      try {
        // Provide WebSocket transport for Node.js runtime
        const ws = require('ws');
        options.realtime = { transport: ws };
      } catch (e) {
        // Fallback for edge or browser runtimes
      }
    }

    client = createClient(supabaseUrl, supabaseAnonKey, options);
  }

  return client;
}
