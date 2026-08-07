import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

export function supabaseAdmin(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

export async function restFetch(path: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const headers: Record<string, string> = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    const msg = data?.message || data?.error || text || `HTTP ${res.status}`;
    return { data: null, error: msg, status: res.status };
  }
  return { data, error: null, status: res.status };
}

export function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResp(message: string, status = 400) {
  return jsonResp({ error: message }, status);
}

const EMAIL_PATTERN =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function validateEmail(email: unknown): string | null {
  if (typeof email !== "string" || email.trim().length > 254) {
    return "A valid email address is required";
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    return "A valid email address is required";
  }
  return null;
}

export function validateStrongPassword(pw: unknown): string | null {
  if (typeof pw !== "string" || pw.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[a-z]/.test(pw)) return "Password must contain a lowercase letter";
  if (!/[A-Z]/.test(pw)) return "Password must contain an uppercase letter";
  if (!/[0-9]/.test(pw)) return "Password must contain a number";
  if (!/[^A-Za-z0-9]/.test(pw)) return "Password must contain a symbol";
  return null;
}

export async function getUser(
  req: Request,
  sb: SupabaseClient
): Promise<{ id: string; role: string; [k: string]: unknown } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];

  const {
    data: { user },
    error,
  } = await sb.auth.getUser(token);
  if (error || !user) return null;

  const { data: profiles } = await restFetch(
    `/profiles?id=eq.${user.id}&select=*`
  );
  return profiles?.[0] || null;
}

export async function requireAuth(
  req: Request,
  sb: SupabaseClient
): Promise<
  { user: { id: string; role: string; [k: string]: unknown }; resp?: never } | { resp: Response }
> {
  const user = await getUser(req, sb);
  if (!user) return { resp: errorResp("Unauthorized", 401) };
  return { user };
}

export async function requireAdmin(
  req: Request,
  sb: SupabaseClient
): Promise<
  { user: { id: string; role: string; [k: string]: unknown }; resp?: never } | { resp: Response }
> {
  const result = await requireAuth(req, sb);
  if (result.resp) return result;
  if (result.user.role !== "admin" && result.user.role !== "super_admin")
    return { resp: errorResp("Admin access required", 403) };
  return result;
}

export async function requireSuperAdmin(
  req: Request,
  sb: SupabaseClient
): Promise<
  { user: { id: string; role: string; [k: string]: unknown }; resp?: never } | { resp: Response }
> {
  const result = await requireAuth(req, sb);
  if (result.resp) return result;
  if (result.user.role !== "super_admin")
    return { resp: errorResp("Super admin access required", 403) };
  return result;
}

export async function requireDoctor(
  req: Request,
  sb: SupabaseClient
): Promise<
  { user: { id: string; role: string; [k: string]: unknown }; resp?: never } | { resp: Response }
> {
  const result = await requireAuth(req, sb);
  if (result.resp) return result;
  if (result.user.role !== "doctor" && result.user.role !== "admin")
    return { resp: errorResp("Doctor access required", 403) };
  return result;
}
