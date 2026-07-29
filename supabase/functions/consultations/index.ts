import "https://esm.sh/@supabase/supabase-js@2";
import {
  supabaseAdmin,
  restFetch,
  jsonResp,
  errorResp,
  corsHeaders,
  requireAuth,
  requireDoctor,
} from "../_shared/helper.ts";

async function attachDoctorProfiles(records: any[]) {
  const doctorIds = [...new Set((records || []).map((r) => r.doctor?.id).filter(Boolean))];
  if (doctorIds.length === 0) return;
  const { data: profiles } = await restFetch(
    `/profiles?id=in.(${doctorIds.join(",")})&select=*`
  );
  (records || []).forEach((r) => {
    if (r.doctor) {
      r.doctor.profiles = (profiles || []).find((p) => p.id === r.doctor.id) || null;
    }
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const sb = supabaseAdmin();
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);

    const fnIdx = segments.indexOf("consultations");
    const rest = segments.slice(fnIdx + 1);
    const id = rest[0] || null;

    if (req.method === "GET" && !id) {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      let query = sb
        .from("consultations")
        .select("*, profiles!patient_id(*), doctor:doctors!doctor_id(*)");

      if (auth.user.role === "admin" || auth.user.role === "super_admin") {
        // admin sees all — no filter
      } else if (auth.user.role === "doctor") {
        const { data: doctorProfile } = await sb
          .from("doctors")
          .select("id")
          .eq("profile_id", auth.user.id)
          .single();
        if (doctorProfile) {
          query = query.eq("doctor_id", doctorProfile.id);
        } else {
          query = query.eq("patient_id", auth.user.id);
        }
      } else {
        query = query.eq("patient_id", auth.user.id);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });
      if (error) return errorResp(error.message, 500);

      await attachDoctorProfiles(data);
      return jsonResp({ consultations: data });
    }

    if (req.method === "POST" && !id) {
      const auth = await requireDoctor(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const { patient_id, doctor_id, doctor_name, specialty, message } = body;

      if (!patient_id) return errorResp("patient_id is required");

      const { data, error } = await sb
        .from("consultations")
        .insert({
          patient_id,
          doctor_id: doctor_id || null,
          doctor_name: doctor_name || null,
          specialty: specialty || null,
          message: message || null,
          status: "pending",
        })
        .select("*, profiles!patient_id(*), doctor:doctors!doctor_id(*)")
        .single();

      if (error) return errorResp(error.message, 500);
      await attachDoctorProfiles([data]);
      return jsonResp(data, 201);
    }

    if (req.method === "PUT" && id) {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      if (
        auth.user.role !== "doctor" &&
        auth.user.role !== "admin" &&
        auth.user.role !== "super_admin"
      ) {
        return errorResp("Doctor access required", 403);
      }

      const body = await req.json();
      const updates: Record<string, unknown> = {};
      if (body.response !== undefined) updates.response = body.response;
      if (body.status !== undefined) updates.status = body.status;

      if (Object.keys(updates).length === 0) {
        return errorResp("No fields to update");
      }

      const { data, error } = await sb
        .from("consultations")
        .update(updates)
        .eq("id", id)
        .select("*, profiles!patient_id(*), doctor:doctors!doctor_id(*)")
        .single();

      if (error) return errorResp(error.message, 500);
      await attachDoctorProfiles([data]);
      return jsonResp(data);
    }

    return errorResp("Not found", 404);
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
