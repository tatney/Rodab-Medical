import "https://esm.sh/@supabase/supabase-js@2";
import {
  supabaseAdmin,
  jsonResp,
  errorResp,
  corsHeaders,
} from "../_shared/helper.ts";

const STAFF_ROLES = ["admin", "doctor", "driver", "super_admin"];

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return errorResp("Method not allowed", 405);
    }

    const sb = supabaseAdmin();
    const body = await req.json();
    const email = (body?.email || "").toString().trim().toLowerCase();
    if (!email) {
      return errorResp("Email is required");
    }
    const redirectTo = (body?.redirectTo || "").toString().trim();

    const { data: profile } = await sb
      .from("profiles")
      .select("id, role, full_name")
      .eq("email", email)
      .maybeSingle();

    if (!profile) {
      return jsonResp({
        message:
          "If an account exists with that email, a password reset link has been sent.",
      });
    }

    if (STAFF_ROLES.includes(profile.role)) {
      await sb.from("notifications").insert({
        user_id: profile.id,
        target_user_id: profile.id,
        title: "Login credentials update",
        message:
          "A password reset was requested for your account. Staff accounts must contact the administrator to receive new login credentials.",
      });

      return jsonResp({
        message:
          "This account is managed by the hospital. Please contact the administrator to receive new login credentials.",
        role: profile.role,
      });
    }

    const options: { redirectTo?: string } = {};
    if (redirectTo) options.redirectTo = redirectTo;

    const { error } = await sb.auth.resetPasswordForEmail(email, options);
    if (error) {
      return errorResp(error.message, 500);
    }

    return jsonResp({
      message:
        "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
