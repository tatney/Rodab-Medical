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

    if (req.method === "GET") {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      return jsonResp({ user: auth.user });
    }

    if (req.method === "PUT") {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      const { full_name, phone, avatar_url, address, date_of_birth, gender } =
        await req.json();

      const updates: Record<string, unknown> = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (phone !== undefined) updates.phone = phone;
      if (avatar_url !== undefined) updates.avatar_url = avatar_url;
      if (address !== undefined) updates.address = address;
      if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth;
      if (gender !== undefined) updates.gender = gender;

      if (Object.keys(updates).length === 0) {
        return errorResp("No fields to update");
      }

      updates.updated_at = new Date().toISOString();

      const { data: profile, error: updateError } = await sb
        .from("profiles")
        .update(updates)
        .eq("id", auth.user.id)
        .select()
        .single();

      if (updateError) {
        return errorResp("Failed to update profile", 500);
      }

      return jsonResp({ user: profile });
    }

    return errorResp("Method not allowed", 405);
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
