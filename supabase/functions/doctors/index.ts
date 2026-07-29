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
    const fnIdx = segments.indexOf("doctors");
    const rest = segments.slice(fnIdx + 1);
    const action = rest[0] || "";
    const paramId = rest[1] || null;

    // GET /doctors/departments
    if (action === "departments" && req.method === "GET") {
      const { data: departments, error: deptError } = await sb
        .from("departments")
        .select("*");

      if (deptError) return errorResp(deptError.message, 500);

      const { data: profiles, error: profError } = await sb
        .from("profiles")
        .select("*")
        .eq("role", "doctor");

      if (profError) return errorResp(profError.message, 500);

      const { data: docRecords, error: docError } = await sb
        .from("doctors")
        .select("*");

      if (docError) return errorResp(docError.message, 500);

      const doctorsByProfile = {};
      (profiles || []).forEach((p) => {
        const d = (docRecords || []).find((r) => r.user_id === p.id);
        doctorsByProfile[p.id] = { ...p, ...d };
      });

      const result = (departments || []).map((dept) => {
        const deptDocs = Object.values(doctorsByProfile).filter(
          (d: any) => d.department === dept.name
        );
        return { ...dept, doctors: deptDocs };
      });

      return jsonResp({ departments: result });
    }

    // GET /doctors
    if (!action && req.method === "GET") {
      const { data: profiles, error: profError } = await sb
        .from("profiles")
        .select("*")
        .eq("role", "doctor");

      if (profError) return errorResp(profError.message, 500);

      const { data: docRecords, error: docError } = await sb
        .from("doctors")
        .select("*");

      if (docError) return errorResp(docError.message, 500);

      const doctors = (profiles || []).map((profile) => {
        const docInfo = (docRecords || []).find((d) => d.user_id === profile.id);
        return { ...profile, ...docInfo };
      });

      return jsonResp({ doctors });
    }

    // DELETE /doctors/:id
    if (!action && paramId && req.method === "DELETE") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { error: deleteError } = await sb
        .from("doctors")
        .delete()
        .eq("id", paramId);

      if (deleteError) {
        return errorResp(deleteError.message, 500);
      }

      const { error: profileError } = await sb
        .from("profiles")
        .update({ role: "user" })
        .eq("id", paramId);

      if (profileError) {
        return errorResp(profileError.message, 500);
      }

      return jsonResp({ message: "Doctor removed successfully" });
    }

    return errorResp("Not found", 404);
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
