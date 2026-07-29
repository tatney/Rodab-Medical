import "https://esm.sh/@supabase/supabase-js@2";
import {
  supabaseAdmin,
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
    const hasUrl = !!Deno.env.get("SUPABASE_URL");
    const hasServiceKey = !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const hasAnonKey = !!Deno.env.get("SUPABASE_ANON_KEY");
    const skLen = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").length;
    const akLen = (Deno.env.get("SUPABASE_ANON_KEY") || "").length;

    const { data: profiles, error: profilesError } = await sb
      .from("profiles")
      .select("count")
      .limit(1);

    return jsonResp({
      env: { hasUrl, hasServiceKey, hasAnonKey, skLen, akLen },
      profilesQuery: { error: profilesError?.message || null, count: profiles?.length || 0 },
    });
  } catch (err) {
    return errorResp(err.message, 500);
  }
});
