import "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResp } from "../_shared/helper.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return jsonResp({ status: "ok", timestamp: new Date().toISOString() });
});
