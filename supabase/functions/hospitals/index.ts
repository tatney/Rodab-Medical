import {
  corsHeaders,
  supabaseAdmin,
  jsonResp,
  errorResp,
  requireAuth,
  requireAdmin,
} from "../_shared/helper.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const fnIdx = segments.indexOf("hospitals");
  const rest = segments.slice(fnIdx + 1);
  let action = rest[0] || "";
  let paramId = rest[1] || null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(action);
  if (isUuid) { paramId = action; action = ""; }
  const sb = supabaseAdmin();

  try {
    // GET /hospitals — public, active hospitals
    if (!action && req.method === "GET") {
      const { data, error } = await sb
        .from("hospitals")
        .select("*")
        .eq("is_active", true);
      if (error) return errorResp(error.message);
      return jsonResp({ hospitals: data });
    }

    // GET /hospitals/all — admin, all hospitals
    if (action === "all" && req.method === "GET") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { data, error } = await sb.from("hospitals").select("*");
      if (error) return errorResp(error.message);
      return jsonResp({ hospitals: data });
    }

    // POST /hospitals — admin, create hospital
    if (!action && req.method === "POST") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const { name, address, phone, email, lat, lng, is_active } = body;
      if (!name) return errorResp("Name is required");

      const { data, error } = await sb
        .from("hospitals")
        .insert({ name, address, phone, email, lat, lng, is_active })
        .select()
        .single();
      if (error) return errorResp(error.message);
      return jsonResp(data, 201);
    }

    // PUT /hospitals/:id — admin, update hospital
    if (!action && paramId && req.method === "PUT") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();

      const { data, error } = await sb
        .from("hospitals")
        .update(body)
        .eq("id", paramId)
        .select()
        .single();
      if (error) return errorResp(error.message);
      return jsonResp(data);
    }

    // DELETE /hospitals/:id — admin, delete hospital
    if (!action && paramId && req.method === "DELETE") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { error } = await sb.from("hospitals").delete().eq("id", paramId);
      if (error) return errorResp(error.message);
      return jsonResp({ message: "Deleted successfully" });
    }

    return errorResp("Not found", 404);
  } catch (err) {
    return errorResp(err.message ?? "Internal server error", 500);
  }
});
