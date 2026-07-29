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
    const fnIdx = segments.indexOf("admin");
    const rest = segments.slice(fnIdx + 1);
    let action = rest[0] || "";
    let paramId = rest[1] || null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(action);
    if (isUuid) { paramId = action; action = ""; }

    // GET /admin/users
    if (action === "users" && !paramId && req.method === "GET") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { data, error } = await sb
        .from("profiles")
        .select("*");

      if (error) {
        return errorResp(error.message, 500);
      }

      return jsonResp({ users: data });
    }

    // POST /admin/users
    if (action === "users" && !paramId && req.method === "POST") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const { email, password, full_name, phone, role } = body;

      if (!email || !password) {
        return errorResp("Email and password are required");
      }

      const { data: authUser, error: authError } = await sb.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        return errorResp(authError.message, 500);
      }

      const { error: profileError } = await sb
        .from("profiles")
        .upsert({
          id: authUser.user.id,
          email,
          full_name: full_name || "",
          phone: phone || "",
          role: role || "user",
        }, { onConflict: "id" });

      if (profileError) {
        return errorResp(profileError.message, 500);
      }

      return jsonResp({ user: authUser.user }, 201);
    }

    // POST /admin/doctors
    if (action === "doctors" && !paramId && req.method === "POST") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const { email, password, full_name, phone, department_id, specialty } = body;

      if (!email || !password) {
        return errorResp("Email and password are required");
      }

      const { data: authUser, error: authError } = await sb.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        return errorResp(authError.message, 500);
      }

      const userId = authUser.user.id;

      const { error: profileError } = await sb
        .from("profiles")
        .upsert({
          id: userId,
          email,
          full_name: full_name || "",
          phone: phone || "",
          role: "doctor",
        }, { onConflict: "id" });

      if (profileError) {
        return errorResp(profileError.message, 500);
      }

      const { data: doctor, error: doctorError } = await sb
        .from("doctor")
        .insert({
          id: userId,
          user_id: userId,
          department_id: department_id || null,
          specialty: specialty || "",
        })
        .select()
        .single();

      if (doctorError) {
        return errorResp(doctorError.message, 500);
      }

      return jsonResp({ doctor }, 201);
    }

    // DELETE /admin/users/:id
    if (action === "users" && paramId && req.method === "DELETE") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { error: profileError } = await sb
        .from("profiles")
        .delete()
        .eq("id", paramId);

      if (profileError) {
        return errorResp(profileError.message, 500);
      }

      const { error: authError } = await sb.auth.admin.deleteUser(paramId);

      if (authError) {
        return errorResp(authError.message, 500);
      }

      return jsonResp({ message: "User deleted successfully" });
    }

    return errorResp("Not found", 404);
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
