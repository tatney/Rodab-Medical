import "https://esm.sh/@supabase/supabase-js@2";
import {
  supabaseAdmin,
  jsonResp,
  errorResp,
  corsHeaders,
  requireAuth,
} from "../_shared/helper.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const sb = supabaseAdmin();
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const fnIdx = segments.indexOf("appointments");
    const rest = segments.slice(fnIdx + 1);
    const action = rest[0] || "";
    const paramId = rest[1] || null;

    // GET /appointments
    if (!action && req.method === "GET") {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      const { user } = auth;
      let query = sb
        .from("appointments")
        .select("*, profiles!patient_id(*), doctor:doctors!doctor_id(*)")
        .order("appointment_date", { ascending: false });

      if (user.role === "user") {
        query = query.eq("patient_id", user.id);
      } else if (user.role === "doctor") {
        const { data: doctorProfile } = await sb
          .from("doctors")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (doctorProfile) {
          query = query.eq("doctor_id", doctorProfile.id);
        }
      }

      const { data, error } = await query;
      if (error) return errorResp(error.message, 500);

      const doctorUserIds = [...new Set((data || []).map((a) => a.doctor?.user_id).filter(Boolean))];
      if (doctorUserIds.length > 0) {
        const { data: doctorProfiles } = await sb
          .from("profiles")
          .select("*")
          .in("id", doctorUserIds);
        (data || []).forEach((a) => {
          if (a.doctor) {
            a.doctor.profiles = (doctorProfiles || []).find((p) => p.id === a.doctor.user_id) || null;
          }
        });
      }

      return jsonResp({ appointments: data });
    }

    // POST /appointments
    if (!action && req.method === "POST") {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const {
        doctor_id,
        appointment_date,
        appointment_time,
        doctor_name,
        department,
        reason,
      } = body;

      if (!doctor_id || !appointment_date || !appointment_time) {
        return errorResp("doctor_id, appointment_date, and appointment_time are required");
      }

      const { data, error } = await sb
        .from("appointments")
        .insert({
          patient_id: auth.user.id,
          doctor_id,
          doctor_name: doctor_name || null,
          department: department || null,
          appointment_date,
          appointment_time,
          reason: reason || null,
        })
        .select("*, profiles!patient_id(*), doctor:doctors!doctor_id(*)")
        .single();

      if (error) return errorResp(error.message, 500);

      if (data?.doctor?.user_id) {
        const { data: docProfile } = await sb
          .from("profiles")
          .select("*")
          .eq("id", data.doctor.user_id)
          .single();
        data.doctor.profiles = docProfile || null;
      }

      return jsonResp(data, 201);
    }

    // DELETE /appointments/:id
    if (!action && paramId && req.method === "DELETE") {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      const { data: appointment, error: fetchError } = await sb
        .from("appointments")
        .select("patient_id")
        .eq("id", paramId)
        .single();

      if (fetchError || !appointment) {
        return errorResp("Appointment not found", 404);
      }

      if (
        auth.user.role === "user" &&
        appointment.patient_id !== auth.user.id
      ) {
        return errorResp("You can only cancel your own appointments", 403);
      }

      const { error: deleteError } = await sb
        .from("appointments")
        .delete()
        .eq("id", paramId);

      if (deleteError) {
        return errorResp(deleteError.message, 500);
      }

      return jsonResp({ message: "Appointment cancelled" });
    }

    return errorResp("Not found", 404);
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
