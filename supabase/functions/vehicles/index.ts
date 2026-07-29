import "https://esm.sh/@supabase/supabase-js@2";
import {
  supabaseAdmin,
  jsonResp,
  errorResp,
  corsHeaders,
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
    const fnIdx = segments.indexOf("vehicles");
    const rest = segments.slice(fnIdx + 1);
    let action = rest[0] || "";
    let paramId = rest[1] || null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(action);
    if (isUuid) { paramId = action; action = ""; }

    // GET /vehicles
    if (!action && req.method === "GET") {
      const { data: vehicles, error } = await sb
        .from("vehicles")
        .select("*");

      if (error) {
        return errorResp(error.message, 500);
      }

      return jsonResp({ vehicles });
    }

    // POST /vehicles
    if (!action && req.method === "POST") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const { plate_number, model, year, type, capacity } = body;

      if (!plate_number || !model) {
        return errorResp("plate_number and model are required");
      }

      const { data: vehicle, error } = await sb
        .from("vehicles")
        .insert({
          plate_number,
          model,
          year: year || null,
          type: type || null,
          capacity: capacity || null,
        })
        .select()
        .single();

      if (error) {
        return errorResp(error.message, 500);
      }

      return jsonResp(vehicle, 201);
    }

    // PUT /vehicles/:id
    if (!action && paramId && req.method === "PUT") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();

      const { data: vehicle, error } = await sb
        .from("vehicles")
        .update(body)
        .eq("id", paramId)
        .select()
        .single();

      if (error) {
        return errorResp(error.message, 500);
      }

      return jsonResp(vehicle);
    }

    // DELETE /vehicles/:id
    if (!action && paramId && req.method === "DELETE") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { error } = await sb
        .from("vehicles")
        .delete()
        .eq("id", paramId);

      if (error) {
        return errorResp(error.message, 500);
      }

      return jsonResp({ message: "Vehicle deleted successfully" });
    }

    return errorResp("Not found", 404);
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
