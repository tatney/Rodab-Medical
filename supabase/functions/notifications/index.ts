import {
  corsHeaders,
  supabaseAdmin,
  jsonResp,
  errorResp,
  requireAuth,
} from "../_shared/helper.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const fnIdx = segments.indexOf("notifications");
  const rest = segments.slice(fnIdx + 1);
  let action = rest[0] || "";
  let paramId = rest[1] || null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(action);
  if (isUuid) { paramId = action; action = ""; }
  const sb = supabaseAdmin();

  try {
    // GET /notifications
    if (!action && req.method === "GET") {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      const { data, error } = await sb
        .from("notifications")
        .select("*")
        .eq("target_user_id", auth.user.id)
        .order("created_at", { ascending: false });
      if (error) return errorResp(error.message);
      return jsonResp({ notifications: data });
    }

    // POST /notifications
    if (!action && req.method === "POST") {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const { target_user_id, title, message, type, target_department } = body;
      if (!target_user_id || !title || !message) {
        return errorResp("Missing required fields");
      }

      const { data, error } = await sb
        .from("notifications")
        .insert({ sender_id: auth.user.id, target_user_id, title, message, type, target_department })
        .select()
        .single();
      if (error) return errorResp(error.message);
      return jsonResp(data, 201);
    }

    return errorResp("Not found", 404);
  } catch (err) {
    return errorResp(err.message ?? "Internal server error", 500);
  }
});
