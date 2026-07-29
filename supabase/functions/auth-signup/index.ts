import "https://esm.sh/@supabase/supabase-js@2";
import {
  supabaseAdmin,
  restFetch,
  jsonResp,
  errorResp,
  corsHeaders,
} from "../_shared/helper.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const sb = supabaseAdmin();
    const { email, password, full_name, phone, role } = await req.json();

    if (!email || !password) {
      return errorResp("Email and password are required");
    }

    const { data: authData, error: authError } = await sb.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return errorResp(authError.message, 400);
    }

    if (!authData.user) {
      return errorResp("Sign up failed", 400);
    }

    const { data: insertData, error: insertError } = await restFetch(
      "/profiles",
      {
        method: "POST",
        headers: { "Prefer": "return=representation" },
        body: JSON.stringify({
          id: authData.user.id,
          email,
          full_name: full_name || null,
          phone: phone || null,
          role: role || "user",
        }),
      },
    );

    if (insertError) {
      return errorResp("Failed to create profile: " + insertError, 500);
    }

    const profile = Array.isArray(insertData) ? insertData[0] : insertData;

    return jsonResp({
      token: authData.session?.access_token || null,
      user: profile,
    });
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
