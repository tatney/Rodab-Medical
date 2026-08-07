import "https://esm.sh/@supabase/supabase-js@2";
import {
  supabaseAdmin,
  jsonResp,
  errorResp,
  corsHeaders,
  requireAuth,
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
    const fnIdx = segments.indexOf("drivers");
    const rest = segments.slice(fnIdx + 1);
    const segment = rest[0] || "";
    const knownActions = ["available", "create", "location"];
    const isAction = knownActions.includes(segment);
    const action = isAction ? segment : "";
    const paramId = isAction ? rest[1] || null : segment || null;

    // GET /drivers/available
    if (action === "available" && req.method === "GET") {
      const { data: drivers, error } = await sb
        .from("profiles")
        .select("*, drivers(*)")
        .eq("role", "driver");

      if (error) {
        return errorResp(error.message, 500);
      }

      const available = (drivers || []).filter(
        (d: any) => d.drivers?.[0]?.is_available === true
      );

      return jsonResp({ drivers: available });
    }

    // POST /drivers/create
    if (action === "create" && req.method === "POST") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const { email, password, full_name, phone, license_number, vehicle_id } =
        body;

      if (!email || !password || !full_name) {
        return errorResp("email, password, and full_name are required");
      }

      const emailError = validateEmail(email);
      if (emailError) return errorResp(emailError);
      const passwordError = validateStrongPassword(password);
      if (passwordError) return errorResp(passwordError);

      const { data: authUser, error: authError } =
        await sb.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      let userId: string;

      if (authError) {
        if (authError.message.includes("already registered")) {
          const { data: existingProfile } = await sb
            .from("profiles")
            .select("id")
            .eq("email", email)
            .maybeSingle();
          if (!existingProfile) {
            return errorResp("Email is already registered but no profile was found. Please delete the auth user manually.", 409);
          }
          userId = existingProfile.id;
        } else {
          return errorResp(authError.message, 500);
        }
      } else {
        userId = authUser.user.id;
      }

      const { error: profileError } = await sb.from("profiles").upsert({
        id: userId,
        email,
        full_name,
        phone: phone || null,
        role: "driver",
      }, { onConflict: "id" });

      if (profileError) {
        return errorResp(profileError.message, 500);
      }

      const { error: userProfileError } = await sb.from("user_profiles").upsert({
        id: userId,
        full_name,
        role: "driver",
      }, { onConflict: "id" });

      if (userProfileError) {
        return errorResp(userProfileError.message, 500);
      }

      const { data: driverRecord, error: driverError } = await sb
        .from("drivers")
        .upsert({
          id: userId,
          user_id: userId,
          profile_id: userId,
          full_name,
          phone: phone || "",
          license_number: license_number || "",
          status: "off_duty",
          vehicle_id: vehicle_id || null,
          is_available: true,
        }, { onConflict: "id" })
        .select("*, profiles(*)")
        .single();

      if (driverError) {
        return errorResp(driverError.message, 500);
      }

      return jsonResp(driverRecord, 201);
    }

    // PUT /drivers/location
    if (action === "location" && req.method === "PUT") {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const { lat, lng } = body;

      if (lat === undefined || lng === undefined) {
        return errorResp("lat and lng are required");
      }

      const { data: driver, error } = await sb
        .from("drivers")
        .update({ current_latitude: lat, current_longitude: lng, last_location_update: new Date().toISOString() })
        .eq("id", auth.user.id)
        .select("*, profiles(*)")
        .single();

      if (error) {
        return errorResp(error.message, 500);
      }

      return jsonResp(driver);
    }

    // GET /drivers
    if (!action && req.method === "GET") {
      const { data: drivers, error } = await sb
        .from("profiles")
        .select("*, drivers(*)")
        .eq("role", "driver");

      if (error) {
        return errorResp(error.message, 500);
      }

      return jsonResp({ drivers });
    }

    // PUT /drivers/:id
    if (!action && paramId && req.method === "PUT") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();

      const { full_name, phone, email, password, license_number, vehicle_id, is_available } =
        body;

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

        if (profileError) {
          return errorResp(profileError.message, 500);
        }
      }

      const driverUpdates: Record<string, unknown> = {};
      if (license_number !== undefined) driverUpdates.license_number = license_number;
      if (vehicle_id !== undefined) driverUpdates.vehicle_id = vehicle_id;
      if (is_available !== undefined) driverUpdates.is_available = is_available;

      if (Object.keys(driverUpdates).length > 0) {
        const { error: driverError } = await sb
          .from("drivers")
          .update(driverUpdates)
          .eq("id", paramId);

        if (driverError) {
          return errorResp(driverError.message, 500);
        }
      }

      const { data: driver, error: fetchError } = await sb
        .from("profiles")
        .select("*, drivers(*)")
        .eq("id", paramId)
        .single();

      if (fetchError) {
        return errorResp(fetchError.message, 500);
      }

      return jsonResp(driver);
    }

    // DELETE /drivers/:id
    if (!action && paramId && req.method === "DELETE") {
      const auth = await requireSuperAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { error: deleteError } = await sb
        .from("drivers")
        .delete()
        .eq("id", paramId);

      if (deleteError) {
        return errorResp(deleteError.message, 500);
      }

      const { error: userProfileError } = await sb
        .from("user_profiles")
        .delete()
        .eq("id", paramId);

      if (userProfileError) {
        return errorResp(userProfileError.message, 500);
      }

      const { error: profileError } = await sb
        .from("profiles")
        .update({ role: "user" })
        .eq("id", paramId);

      if (profileError) {
        return errorResp(profileError.message, 500);
      }

      const { error: authError } = await sb.auth.admin.deleteUser(paramId);
      if (authError) {
        return errorResp(authError.message, 500);
      }

      return jsonResp({ message: "Driver removed successfully" });
    }

    return errorResp("Not found", 404);
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
