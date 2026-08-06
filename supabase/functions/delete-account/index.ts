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
    if (req.method !== "DELETE") {
      return errorResp("Method not allowed", 405);
    }

    const sb = supabaseAdmin();
    const auth = await requireAuth(req, sb);
    if (auth.resp) return auth.resp;

    if (auth.user.role !== "user") {
      return errorResp(
        "Only patient accounts can be deleted. Please contact an administrator.",
        403
      );
    }

    const userId = auth.user.id;

    await sb.from("notifications").delete().eq("target_user_id", userId);
    await sb.from("notifications").delete().eq("user_id", userId);

    const { error: authError } = await sb.auth.admin.deleteUser(userId);
    if (authError) {
      return errorResp(authError.message, 500);
    }

    return jsonResp({ message: "Account deleted successfully" });
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
