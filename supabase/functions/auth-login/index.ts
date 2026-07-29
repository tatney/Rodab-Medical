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
    const { email, password } = await req.json();

    if (!email || !password) {
      return errorResp("Email and password are required");
    }

    const { data: authData, error: authError } = await sb.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return errorResp(authError.message, 401);
    }

    const { data: profile } = await restFetch(
      `/profiles?id=eq.${authData.user.id}&select=*`,
    );

    let userProfile = profile?.[0] || null;
    if (!userProfile) {
      const { data: userProfiles } = await restFetch(
        `/user_profiles?id=eq.${authData.user.id}&select=role`
      );
      const role = userProfiles?.[0]?.role || "user";
      const { data: insertData, error: insertError } = await restFetch(
        "/profiles",
        {
          method: "POST",
          headers: { "Prefer": "return=representation" },
          body: JSON.stringify({
            id: authData.user.id,
            email: authData.user.email,
            role,
          }),
        },
      );
      if (insertError) {
        return errorResp("Create profile failed: " + insertError, 500);
      }
      userProfile = Array.isArray(insertData) ? insertData[0] : insertData;
    }

    return jsonResp({
      token: authData.session.access_token,
      user: userProfile,
    });
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
