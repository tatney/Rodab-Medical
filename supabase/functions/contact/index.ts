import "https://esm.sh/@supabase/supabase-js@2";
import {
  supabaseAdmin,
  jsonResp,
  errorResp,
  corsHeaders,
  requireAuth,
  requireAdmin,
} from "../_shared/helper.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const sb = supabaseAdmin();
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const fnIdx = segments.indexOf("contact");
    const rest = segments.slice(fnIdx + 1);
    let action = rest[0] || "";
    let paramId = rest[1] || null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(action);
    if (isUuid) { paramId = action; action = ""; }

    // POST /contact — public, submit contact message
    if (!action && req.method === "POST") {
      const { full_name, email, subject, message, phone } = await req.json();

      if (!full_name || !email || !message) {
        return errorResp("full_name, email, and message are required");
      }

      const { data, error } = await sb
        .from("contact_messages")
        .insert({
          full_name,
          email,
          subject: subject || null,
          message,
          phone: phone || null,
          form_type: "contact",
        })
        .select()
        .single();

      if (error) return errorResp(error.message, 500);
      return jsonResp(data, 201);
    }

    // GET /contact/mine — auth, returns user's messages
    if (action === "mine" && req.method === "GET") {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      const { data, error } = await sb
        .from("contact_messages")
        .select("*")
        .eq("email", auth.user.email)
        .order("created_at", { ascending: false });

      if (error) return errorResp(error.message, 500);
      return jsonResp({ messages: data });
    }

    // GET /contact/admin — admin, returns all messages
    if (action === "admin" && req.method === "GET") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { data, error } = await sb
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) return errorResp(error.message, 500);
      return jsonResp({ messages: data });
    }

    // PUT /contact/:id — auth, update own message
    if (!action && paramId && req.method === "PUT") {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();

      const { data: existing, error: fetchError } = await sb
        .from("contact_messages")
        .select("email")
        .eq("id", paramId)
        .single();

      if (fetchError || !existing) {
        return errorResp("Message not found", 404);
      }

      if (existing.email !== auth.user.email && auth.user.role !== "admin" && auth.user.role !== "super_admin") {
        return errorResp("You can only update your own messages", 403);
      }

      const updates: Record<string, unknown> = {};
      if (body.full_name !== undefined) updates.full_name = body.full_name;
      if (body.email !== undefined) updates.email = body.email;
      if (body.subject !== undefined) updates.subject = body.subject;
      if (body.message !== undefined) updates.message = body.message;
      if (body.phone !== undefined) updates.phone = body.phone;

      const { data, error } = await sb
        .from("contact_messages")
        .update(updates)
        .eq("id", paramId)
        .select()
        .single();

      if (error) return errorResp(error.message, 500);
      return jsonResp(data);
    }

    return errorResp("Not found", 404);
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
