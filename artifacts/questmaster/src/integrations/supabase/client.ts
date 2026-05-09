// Stub client — Supabase replaced by REST API routes in /api/*
// All real data calls go through src/lib/api.ts and useAuth

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: (_cb: unknown) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: async (_opts: unknown) => ({ data: null, error: new Error("Use /api/auth") }),
    signInWithPassword: async (_opts: unknown) => ({ data: null, error: new Error("Use /api/auth") }),
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async (_email: unknown, _opts: unknown) => ({ error: null }),
    updateUser: async (_opts: unknown) => ({ data: null, error: null }),
  },
  from: (_table: string) => ({
    select: (_cols?: string) => ({
      eq: (_col: string, _val: unknown) => ({
        order: () => ({ data: [], error: null }),
        maybeSingle: async () => ({ data: null, error: null }),
        single: async () => ({ data: null, error: null }),
        in: (_col2: string, _vals: unknown[]) => ({ data: [], error: null }),
        data: [], error: null,
      }),
      order: (_col: string, _opts?: unknown) => ({
        limit: (_n: number) => ({ data: [], error: null }),
        data: [], error: null,
      }),
      in: (_col: string, _vals: unknown[]) => ({ data: [], error: null }),
      limit: (_n: number) => ({ data: [], error: null }),
      maybeSingle: async () => ({ data: null, error: null }),
    }),
    insert: (_data: unknown) => ({
      select: () => ({ single: async () => ({ data: null, error: null }) }),
      error: null,
    }),
    update: (_data: unknown) => ({
      eq: (_col: string, _val: unknown) => ({ error: null }),
    }),
    delete: () => ({
      eq: (_col: string, _val: unknown) => ({ error: null }),
    }),
    upsert: (_data: unknown, _opts?: unknown) => ({ error: null }),
  }),
  storage: {
    from: (_bucket: string) => ({
      upload: async (_path: string, _file: unknown) => ({ error: null }),
      getPublicUrl: (_path: string) => ({ data: { publicUrl: "" } }),
    }),
  },
  functions: {
    invoke: async (_name: string) => ({ data: null, error: null }),
  },
  channel: (_name: string) => ({
    on: (_event: string, _opts: unknown, _cb: unknown) => ({
      subscribe: () => ({}),
    }),
  }),
  removeChannel: (_channel: unknown) => {},
};