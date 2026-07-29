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
  const fnIdx = segments.indexOf("availability");
  const rest = segments.slice(fnIdx + 1);
  let action = rest[0] || "";
  let paramId = rest[1] || null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(action);
  if (isUuid) { paramId = action; action = ""; }
  const sb = supabaseAdmin();

  try {
    // GET /availability/department/:deptId
    if (action === "department" && paramId && req.method === "GET") {
      const { data, error } = await sb
        .from("availability")
        .select("*")
        .eq("department", decodeURIComponent(paramId));
      if (error) return errorResp(error.message);
      return jsonResp({ availability: data });
    }

    // GET /availability/:doctorId
    if (!action && paramId && req.method === "GET") {
      const { data, error } = await sb
        .from("availability")
        .select("*")
        .eq("doctor_id", paramId);
      if (error) return errorResp(error.message);
      return jsonResp({ availability: data });
    }

    // POST /availability
    if (!action && !paramId && req.method === "POST") {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const { doctor_id, day_of_week, start_time, end_time } = body;
      if (!doctor_id || day_of_week === undefined || !start_time || !end_time) {
        return errorResp("Missing required fields");
      }

      const { data, error } = await sb
        .from("availability")
        .insert({ doctor_id, day_of_week, start_time, end_time })
        .select()
        .single();
      if (error) return errorResp(error.message);
      return jsonResp(data, 201);
    }

    // DELETE /availability/:id
    if (!action && paramId && req.method === "DELETE") {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      const { error } = await sb.from("availability").delete().eq("id", paramId);
      if (error) return errorResp(error.message);
      return jsonResp({ message: "Deleted successfully" });
    }

    return errorResp("Not found", 404);
  } catch (err) {
    return errorResp(err.message ?? "Internal server error", 500);
  }
});
