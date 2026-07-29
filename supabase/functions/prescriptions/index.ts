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
    const fnIdx = segments.indexOf("prescriptions");
    const rest = segments.slice(fnIdx + 1);
    let action = rest[0] || "";
    let paramId = rest[1] || null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(action);
    if (isUuid) { paramId = action; action = ""; }

    // GET /prescriptions — auth, returns user's prescriptions
    if (!action && req.method === "GET") {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      const { data, error } = await sb
        .from("repeat_prescriptions")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false });

      if (error) return errorResp(error.message, 500);
      return jsonResp({ prescriptions: data });
    }

    // POST /prescriptions/request — auth, create prescription request
    if (action === "request" && req.method === "POST") {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();

      if (!body.medication_name && !body.medication) {
        return errorResp("medication_name is required");
      }

      const { data, error } = await sb
        .from("repeat_prescriptions")
        .insert({
          user_id: auth.user.id,
          medication: body.medication || body.medication_name,
          first_name: body.first_name || null,
          last_name: body.last_name || null,
          date_of_birth: body.date_of_birth || null,
          email: body.email || null,
          phone: body.phone || null,
          address: body.address || null,
          name_of_gp: body.name_of_gp || body.doctor_name || null,
          pharmacy: body.pharmacy || null,
          additional_info: body.additional_info || body.reason || null,
          is_private_patient: body.is_private_patient || false,
          consent: body.consent || false,
          status: "pending",
        })
        .select()
        .single();

      if (error) return errorResp(error.message, 500);
      return jsonResp(data, 201);
    }

    // GET /prescriptions/admin — admin, returns all prescriptions
    if (action === "admin" && req.method === "GET") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { data, error } = await sb
        .from("repeat_prescriptions")
        .select("*, profiles!user_id(full_name, email)")
        .order("created_at", { ascending: false });

      if (error) return errorResp(error.message, 500);
      return jsonResp({ prescriptions: data });
    }

    // PUT /prescriptions/approve/:id — admin, update prescription status
    if (action === "approve" && paramId && req.method === "PUT") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { status } = await req.json();

      if (!status) {
        return errorResp("status is required");
      }

      const { data, error } = await sb
        .from("repeat_prescriptions")
        .update({ status })
        .eq("id", paramId)
        .select()
        .single();

      if (error) return errorResp(error.message, 500);
      if (!data) return errorResp("Prescription not found", 404);
      return jsonResp(data);
    }

    return errorResp("Not found", 404);
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
