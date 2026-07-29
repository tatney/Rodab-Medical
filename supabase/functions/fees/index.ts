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
    const fnIdx = segments.indexOf("fees");
    const rest = segments.slice(fnIdx + 1);
    const action = rest[0] || "";
    const paramId = rest[1] || null;

    // GET /fees — public, returns active fees
    if (!action && req.method === "GET") {
      const { data, error } = await sb
        .from("fees")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) return errorResp(error.message, 500);
      return jsonResp({ fees: data });
    }

    // GET /fees/admin — admin, returns all fees
    if (action === "admin" && req.method === "GET") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { data, error } = await sb
        .from("fees")
        .select("*")
        .order("name");

      if (error) return errorResp(error.message, 500);
      return jsonResp({ fees: data });
    }

    // POST /fees — admin, create fee
    if (!action && req.method === "POST") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { name, amount, description, department_id, is_active } = await req.json();

      if (!name || amount === undefined) {
        return errorResp("name and amount are required");
      }

      const { data, error } = await sb
        .from("fees")
        .insert({
          name,
          amount,
          description: description || null,
          department_id: department_id || null,
          is_active: is_active !== undefined ? is_active : true,
        })
        .select()
        .single();

      if (error) return errorResp(error.message, 500);
      return jsonResp(data, 201);
    }

    // PUT /fees/:id — admin, update fee
    if (!action && paramId && req.method === "PUT") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();

      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.amount !== undefined) updates.amount = body.amount;
      if (body.description !== undefined) updates.description = body.description;
      if (body.department_id !== undefined) updates.department_id = body.department_id;
      if (body.is_active !== undefined) updates.is_active = body.is_active;

      const { data, error } = await sb
        .from("fees")
        .update(updates)
        .eq("id", paramId)
        .select()
        .single();

      if (error) return errorResp(error.message, 500);
      if (!data) return errorResp("Fee not found", 404);
      return jsonResp(data);
    }

    // DELETE /fees/:id — admin, delete fee
    if (!action && paramId && req.method === "DELETE") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { error } = await sb.from("fees").delete().eq("id", paramId);

      if (error) return errorResp(error.message, 500);
      return jsonResp({ message: "Fee deleted successfully" });
    }

    return errorResp("Not found", 404);
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
