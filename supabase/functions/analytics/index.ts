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
    const fnIdx = segments.indexOf("analytics");
    const rest = segments.slice(fnIdx + 1);
    const action = rest[0] || "";

    // GET /analytics
    if (!action && req.method === "GET") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const [
        usersResult,
        doctorsResult,
        appointmentsResult,
        emergenciesResult,
        recentResult,
        deptResult,
      ] = await Promise.all([
        sb
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "user"),
        sb
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "doctor"),
        sb
          .from("appointments")
          .select("id", { count: "exact", head: true }),
        sb
          .from("ambulance_rides")
          .select("id", { count: "exact", head: true })
          .not("status", "in", "(completed,cancelled)"),
        sb
          .from("appointments")
          .select("*, profiles!inner(full_name), doctor:doctors!doctor_id(specialty)")
          .order("created_at", { ascending: false })
          .limit(10),
        sb
          .from("appointments")
          .select("department")
          .order("created_at", { ascending: false }),
      ]);

      if (
        usersResult.error ||
        doctorsResult.error ||
        appointmentsResult.error ||
        emergenciesResult.error ||
        recentResult.error ||
        deptResult.error
      ) {
        const firstError =
          usersResult.error ||
          doctorsResult.error ||
          appointmentsResult.error ||
          emergenciesResult.error ||
          recentResult.error ||
          deptResult.error;
        return errorResp(firstError!.message, 500);
      }

      const appointmentsByDept: Record<string, number> = {};
      for (const row of deptResult.data || []) {
        const deptName = (row as any).department || "Unknown";
        appointmentsByDept[deptName] = (appointmentsByDept[deptName] || 0) + 1;
      }

      return jsonResp({
        analytics: {
          totalUsers: usersResult.count || 0,
          totalDoctors: doctorsResult.count || 0,
          totalAppointments: appointmentsResult.count || 0,
          activeEmergencies: emergenciesResult.count || 0,
          recentAppointments: recentResult.data || [],
          appointmentsByDept,
        },
      });
    }

    return errorResp("Not found", 404);
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
