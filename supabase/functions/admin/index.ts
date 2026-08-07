import "https://esm.sh/@supabase/supabase-js@2";
import {
  supabaseAdmin,
  jsonResp,
  errorResp,
  corsHeaders,
  requireAdmin,
  requireSuperAdmin,
  validateEmail,
  validateStrongPassword,
} from "../_shared/helper.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const sb = supabaseAdmin();
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const fnIdx = segments.indexOf("admin");
    const rest = segments.slice(fnIdx + 1);
    let action = rest[0] || "";
    let paramId = rest[1] || null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(action);
    if (isUuid) { paramId = action; action = ""; }

    // GET /admin/users
    if (action === "users" && !paramId && req.method === "GET") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { data, error } = await sb
        .from("profiles")
        .select("*");

      if (error) {
        return errorResp(error.message, 500);
      }

      return jsonResp({ users: data });
    }

    // POST /admin/users
    if (action === "users" && !paramId && req.method === "POST") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const { email, password, full_name, phone, role } = body;

      const emailError = validateEmail(email);
      if (emailError) return errorResp(emailError);
      const passwordError = validateStrongPassword(password);
      if (passwordError) return errorResp(passwordError);

      const { data: authUser, error: authError } = await sb.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        return errorResp(authError.message, 500);
      }

      const { error: profileError } = await sb
        .from("profiles")
        .upsert({
          id: authUser.user.id,
          email,
          full_name: full_name || "",
          phone: phone || "",
          role: role || "user",
        }, { onConflict: "id" });

      if (profileError) {
        return errorResp(profileError.message, 500);
      }

      return jsonResp({ user: authUser.user }, 201);
    }

    // POST /admin/doctors
    if (action === "doctors" && !paramId && req.method === "POST") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const { email, password, full_name, phone, department_id, specialty } = body;

      const emailError = validateEmail(email);
      if (emailError) return errorResp(emailError);
      const passwordError = validateStrongPassword(password);
      if (passwordError) return errorResp(passwordError);

      const { data: authUser, error: authError } = await sb.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        return errorResp(authError.message, 500);
      }

      const userId = authUser.user.id;

      const { error: profileError } = await sb
        .from("profiles")
        .upsert({
          id: userId,
          email,
          full_name: full_name || "",
          phone: phone || "",
          role: "doctor",
        }, { onConflict: "id" });

      if (profileError) {
        return errorResp(profileError.message, 500);
      }

      const { data: doctor, error: doctorError } = await sb
        .from("doctor")
        .insert({
          id: userId,
          user_id: userId,
          department_id: department_id || null,
          specialty: specialty || "",
        })
        .select()
        .single();

      if (doctorError) {
        return errorResp(doctorError.message, 500);
      }

      return jsonResp({ doctor }, 201);
    }

    // DELETE /admin/users/:id
    if (action === "users" && paramId && req.method === "DELETE") {
      const auth = await requireSuperAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { error: profileError } = await sb
        .from("profiles")
        .delete()
        .eq("id", paramId);

      if (profileError) {
        return errorResp(profileError.message, 500);
      }

      const { error: authError } = await sb.auth.admin.deleteUser(paramId);

      if (authError) {
        return errorResp(authError.message, 500);
      }

      return jsonResp({ message: "User deleted successfully" });
    }

    // POST /admin/users/:id/flag
    if (action === "users" && paramId && req.method === "POST" && rest[2] === "flag") {
      const auth = await requireSuperAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const reason = (body?.reason || "").toString().trim();
      if (!reason) return errorResp("Flag reason is required");

      const { error } = await sb
        .from("profiles")
        .update({
          is_flagged: true,
          flag_reason: reason,
          flagged_at: new Date().toISOString(),
          flagged_by: auth.user.id,
        })
        .eq("id", paramId);

      if (error) return errorResp(error.message, 500);

      await sb.auth.admin.signOut(paramId);
      await sb.from("account_actions").insert({
        user_id: paramId,
        action_type: "flag",
        detail: reason,
        performed_by: auth.user.id,
      });
      await sb.from("notifications").insert({
        user_id: paramId,
        target_user_id: paramId,
        title: "Account flagged",
        message: `Your account has been flagged for the following reason: ${reason}. Please contact support.`,
      });

      return jsonResp({ message: "User flagged successfully" });
    }

    // POST /admin/users/:id/unflag
    if (action === "users" && paramId && req.method === "POST" && rest[2] === "unflag") {
      const auth = await requireSuperAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { error } = await sb
        .from("profiles")
        .update({
          is_flagged: false,
          flag_reason: null,
          flagged_at: null,
          flagged_by: null,
        })
        .eq("id", paramId);

      if (error) return errorResp(error.message, 500);

      await sb.from("account_actions").insert({
        user_id: paramId,
        action_type: "unflag",
        performed_by: auth.user.id,
      });
      await sb.from("notifications").insert({
        user_id: paramId,
        target_user_id: paramId,
        title: "Account reinstated",
        message: "Your account has been reinstated.",
      });

      return jsonResp({ message: "User unflagged successfully" });
    }

    // POST /admin/users/:id/reward
    if (action === "users" && paramId && req.method === "POST" && rest[2] === "reward") {
      const auth = await requireSuperAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const amount = Number(body?.amount);
      if (!Number.isInteger(amount) || amount <= 0) {
        return errorResp("A positive integer amount is required");
      }
      const reason = (body?.reason || "").toString().trim();

      const { data: profile, error: fetchError } = await sb
        .from("profiles")
        .select("reward_points")
        .eq("id", paramId)
        .single();
      if (fetchError) return errorResp(fetchError.message, 500);

      const { error } = await sb
        .from("profiles")
        .update({ reward_points: (profile.reward_points || 0) + amount })
        .eq("id", paramId);

      if (error) return errorResp(error.message, 500);

      await sb.from("account_actions").insert({
        user_id: paramId,
        action_type: "reward",
        detail: reason,
        amount,
        performed_by: auth.user.id,
      });
      await sb.from("notifications").insert({
        user_id: paramId,
        target_user_id: paramId,
        title: "Reward points added",
        message: `You received ${amount} reward point(s).${reason ? ` Reason: ${reason}` : ""}`,
      });

      return jsonResp({ message: "Reward granted successfully" });
    }

    // PUT /admin/users/:id  (super admin: update staff/admin account incl email & password)
    if (action === "users" && paramId && req.method === "PUT") {
      const auth = await requireSuperAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const { email, password, full_name, phone, role } = body;

      const authUpdates: Record<string, unknown> = {};
      if (email !== undefined) {
        const emailError = validateEmail(email);
        if (emailError) return errorResp(emailError);
        authUpdates.email = email;
      }
      if (password !== undefined) {
        const passwordError = validateStrongPassword(password);
        if (passwordError) return errorResp(passwordError);
        authUpdates.password = password;
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await sb.auth.admin.updateUserById(
          paramId,
          authUpdates
        );
        if (authError) return errorResp(authError.message, 500);
      }

      const profileUpdates: Record<string, unknown> = {};
      if (full_name !== undefined) profileUpdates.full_name = full_name;
      if (phone !== undefined) profileUpdates.phone = phone;
      if (email !== undefined) profileUpdates.email = email;
      if (role !== undefined) profileUpdates.role = role;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await sb
          .from("profiles")
          .update(profileUpdates)
          .eq("id", paramId);
        if (profileError) return errorResp(profileError.message, 500);
      }

      const { data: updated, error: fetchError } = await sb
        .from("profiles")
        .select("*, doctor(*), drivers(*)")
        .eq("id", paramId)
        .maybeSingle();
      if (fetchError) return errorResp(fetchError.message, 500);

      return jsonResp({ user: updated });
    }

    // PUT /admin/doctors/:id  (super admin: update doctor incl email & password)
    if (action === "doctors" && paramId && req.method === "PUT") {
      const auth = await requireSuperAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const { email, password, full_name, phone, department_id, specialty, consultation_fee } = body;

      const authUpdates: Record<string, unknown> = {};
      if (email !== undefined) {
        const emailError = validateEmail(email);
        if (emailError) return errorResp(emailError);
        authUpdates.email = email;
      }
      if (password !== undefined) {
        const passwordError = validateStrongPassword(password);
        if (passwordError) return errorResp(passwordError);
        authUpdates.password = password;
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await sb.auth.admin.updateUserById(
          paramId,
          authUpdates
        );
        if (authError) return errorResp(authError.message, 500);
      }

      const profileUpdates: Record<string, unknown> = {};
      if (full_name !== undefined) profileUpdates.full_name = full_name;
      if (phone !== undefined) profileUpdates.phone = phone;
      if (email !== undefined) profileUpdates.email = email;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await sb
          .from("profiles")
          .update(profileUpdates)
          .eq("id", paramId);
        if (profileError) return errorResp(profileError.message, 500);
      }

      const doctorUpdates: Record<string, unknown> = {};
      if (department_id !== undefined) doctorUpdates.department_id = department_id || null;
      if (specialty !== undefined) doctorUpdates.specialty = specialty;
      if (consultation_fee !== undefined) doctorUpdates.consultation_fee = consultation_fee;

      if (Object.keys(doctorUpdates).length > 0) {
        const { error: doctorError } = await sb
          .from("doctor")
          .update(doctorUpdates)
          .eq("id", paramId);
        if (doctorError) return errorResp(doctorError.message, 500);
      }

      const { data: updated, error: fetchError } = await sb
        .from("profiles")
        .select("*, doctor(*)")
        .eq("id", paramId)
        .maybeSingle();
      if (fetchError) return errorResp(fetchError.message, 500);

      return jsonResp({ user: updated });
    }

    return errorResp("Not found", 404);
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
