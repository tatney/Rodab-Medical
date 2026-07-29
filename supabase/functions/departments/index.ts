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
    const fnIdx = segments.indexOf("departments");
    const rest = segments.slice(fnIdx + 1);
    const action = rest[0] || "";
    const paramId = rest[1] || null;

    // GET /departments/with-doctors
    if (action === "with-doctors" && req.method === "GET") {
      const { data: departments, error } = await sb
        .from("departments")
        .select("*");

      if (error) {
        return errorResp(error.message, 500);
      }

      const result = await Promise.all(
        (departments || []).map(async (dept) => {
          const { data: doctors } = await sb
            .from("doctor")
            .select("*, profiles!user_id(full_name, email)")
            .eq("department_id", dept.id);
          return { ...dept, doctors: doctors || [] };
        })
      );

      return jsonResp({ departments: result });
    }

    // GET /departments
    if (!action && req.method === "GET") {
      const { data: departments, error } = await sb
        .from("departments")
        .select("*");

      if (error) {
        return errorResp(error.message, 500);
      }

      return jsonResp({ departments });
    }

    // POST /departments
    if (!action && req.method === "POST") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const { name, description } = body;

      if (!name) {
        return errorResp("name is required");
      }

      const { data: department, error } = await sb
        .from("departments")
        .insert({ name, description: description || null })
        .select()
        .single();

      if (error) {
        return errorResp(error.message, 500);
      }

      return jsonResp(department, 201);
    }

    // PUT /departments/:id
    if (!action && paramId && req.method === "PUT") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();

      const { data: department, error } = await sb
        .from("departments")
        .update(body)
        .eq("id", paramId)
        .select()
        .single();

      if (error) {
        return errorResp(error.message, 500);
      }

      return jsonResp(department);
    }

    // DELETE /departments/:id
    if (!action && paramId && req.method === "DELETE") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { error } = await sb
        .from("departments")
        .delete()
        .eq("id", paramId);

      if (error) {
        return errorResp(error.message, 500);
      }

      return jsonResp({ message: "Department deleted successfully" });
    }

    return errorResp("Not found", 404);
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
