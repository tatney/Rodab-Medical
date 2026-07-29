import "https://esm.sh/@supabase/supabase-js@2";
import {
  supabaseAdmin,
  jsonResp,
  errorResp,
  corsHeaders,
  requireAuth,
  requireAdmin,
} from "../_shared/helper.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const sb = supabaseAdmin();
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);

    // Find the function segment ("ambulance") and get what's after it
    const fnIdx = segments.indexOf("ambulance");
    const rest = segments.slice(fnIdx + 1);
    const action = rest[0] || "";
    const paramId = rest[1] || null;

    // POST /ambulance — dispatch (authenticated)
    if (req.method === "POST" && action === "") {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const {
        pickup_lat,
        pickup_lng,
        pickup_address,
        destination,
        priority,
        hospital_id,
        notes,
      } = body;

      const { data, error } = await sb
        .from("ambulance_rides")
        .insert({
          patient_id: auth.user.id,
          pickup_lat: pickup_lat || null,
          pickup_lng: pickup_lng || null,
          pickup_address: pickup_address || null,
          destination: destination || null,
          priority: priority || "medium",
          hospital_id: hospital_id || null,
          notes: notes || null,
          status: "dispatched",
          is_guest: false,
        })
        .select()
        .single();

      if (error) return errorResp(error.message, 500);
      return jsonResp(data, 201);
    }

    // POST /ambulance/guest — guest dispatch (public)
    if (req.method === "POST" && action === "guest") {
      const body = await req.json();
      const {
        pickup_lat,
        pickup_lng,
        pickup_address,
        destination,
        priority,
        patient_name,
        patient_phone,
        notes,
      } = body;

      if (!patient_name || !patient_phone) {
        return errorResp("patient_name and patient_phone are required");
      }

      const { data, error } = await sb
        .from("ambulance_rides")
        .insert({
          patient_id: null,
          pickup_lat: pickup_lat || null,
          pickup_lng: pickup_lng || null,
          pickup_address: pickup_address || null,
          destination: destination || null,
          priority: priority || "medium",
          hospital_id: null,
          notes: notes || null,
          status: "dispatched",
          is_guest: true,
          patient_name,
          patient_phone,
        })
        .select()
        .single();

      if (error) return errorResp(error.message, 500);
      return jsonResp(data, 201);
    }

    // GET /ambulance/history — user's ride history
    if (req.method === "GET" && action === "history") {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      const { data, error } = await sb
        .from("ambulance_rides")
        .select("*")
        .eq("patient_id", auth.user.id)
        .order("created_at", { ascending: false });

      if (error) return errorResp(error.message, 500);
      return jsonResp({ rides: data });
    }

    // GET /ambulance/active — admin only, non-terminal rides
    if (req.method === "GET" && action === "active") {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const { data, error } = await sb
        .from("ambulance_rides")
        .select("*")
        .not("status", "in", "(completed,cancelled)")
        .order("created_at", { ascending: false });

      if (error) return errorResp(error.message, 500);
      return jsonResp({ emergencies: data });
    }

    // GET /ambulance/driver-rides — driver's assigned rides
    if (req.method === "GET" && action === "driver-rides") {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      const { data: driverProfile } = await sb
        .from("drivers")
        .select("id")
        .eq("user_id", auth.user.id)
        .single();

      if (!driverProfile) {
        return jsonResp({ rides: [] });
      }

      const { data, error } = await sb
        .from("ambulance_rides")
        .select("*")
        .eq("driver_id", driverProfile.id)
        .order("created_at", { ascending: false });

      if (error) return errorResp(error.message, 500);
      return jsonResp({ rides: data });
    }

    // GET /ambulance/track/:id — public tracking
    if (req.method === "GET" && action === "track" && paramId) {
      const { data: ride, error: rideErr } = await sb
        .from("ambulance_rides")
        .select("pickup_lat, pickup_lng, pickup_address, status, driver_id")
        .eq("id", paramId)
        .single();

      if (rideErr || !ride) return errorResp("Ride not found", 404);

      let driver_location = null;
      if (ride.driver_id) {
        const { data: driver } = await sb
          .from("driver")
          .select("lat, lng")
          .eq("id", ride.driver_id)
          .single();
        if (driver) {
          driver_location = {
            lat: driver.lat,
            lng: driver.lng,
          };
        }
      }

      return jsonResp({ ride, driver_location });
    }

    // PUT /ambulance/assign/:id — admin assigns driver
    if (req.method === "PUT" && action === "assign" && paramId) {
      const auth = await requireAdmin(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const { driver_id } = body;
      if (!driver_id) return errorResp("driver_id is required");

      const { data, error } = await sb
        .from("ambulance_rides")
        .update({ driver_id, status: "assigned" })
        .eq("id", paramId)
        .select()
        .single();

      if (error) return errorResp(error.message, 500);
      return jsonResp(data);
    }

    // PUT /ambulance/status/:id — update ride status
    if (req.method === "PUT" && action === "status" && paramId) {
      const auth = await requireAuth(req, sb);
      if (auth.resp) return auth.resp;

      const body = await req.json();
      const { status } = body;
      const validStatuses = [
        "dispatched",
        "assigned",
        "en_route",
        "arrived",
        "completed",
        "cancelled",
      ];
      if (!status || !validStatuses.includes(status)) {
        return errorResp(
          `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        );
      }

      const { data, error } = await sb
        .from("ambulance_rides")
        .update({ status })
        .eq("id", paramId)
        .select()
        .single();

      if (error) return errorResp(error.message, 500);
      return jsonResp(data);
    }

    return errorResp("Not found", 404);
  } catch (err) {
    return errorResp(err.message || "Internal server error", 500);
  }
});
