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
    const fnIdx = segments.indexOf("illness-certificates");
    const rest = segments.slice(fnIdx + 1);
    let action = rest[0] || "";
    let paramId = rest[1] || null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(action);
    if (isUuid) { paramId = action; action = ""; }

    // POST /illness-certificates/request — auth, create illness certificate request
    if (action === "request" && req.method === "POST") {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      const { reason, start_date, end_date, first_name, last_name, date_of_birth, email, phone, address } = await req.json();

      if (!reason || !start_date) {
        return errorResp("reason and start_date are required");
      }

      const { data, error } = await sb
        .from("illness_certificates")
        .insert({
          user_id: auth.user.id,
          reason,
          certificate_start_date: start_date,
          certificate_end_date: end_date || null,
          first_name: first_name || null,
          last_name: last_name || null,
          date_of_birth: date_of_birth || null,
          email: email || null,
          phone: phone || null,
          address: address || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) return errorResp(error.message, 500);
      return jsonResp(data, 201);
    }

    // GET /illness-certificates/admin — admin, returns all certificates
    if (action === "admin" && req.method === "GET") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { data, error } = await sb
        .from("illness_certificates")
        .select("*, profiles!user_id(full_name, email)")
        .order("created_at", { ascending: false });

      if (error) return errorResp(error.message, 500);
      return jsonResp({ certificates: data });
    }

    // PUT /illness-certificates/approve/:id — admin, update certificate status
    if (action === "approve" && paramId && req.method === "PUT") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { status } = await req.json();

      if (!status) {
        return errorResp("status is required");
      }

      const { data, error } = await sb
        .from("illness_certificates")
        .update({ status })
        .eq("id", paramId)
        .select()
        .single();

      if (error) return errorResp(error.message, 500);
      if (!data) return errorResp("Certificate not found", 404);
      return jsonResp(data);
    }

    return errorResp("Not found", 404);
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
