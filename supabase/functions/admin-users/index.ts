import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!authHeader || !supabaseUrl || !serviceRoleKey) {
    return json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user: caller },
    error: callerError,
  } = await adminClient.auth.getUser(token);

  if (callerError || !caller) {
    return json({ error: "Unauthorized" }, 401);
  }

  if (caller.app_metadata?.role !== "admin") {
    return json({ error: "Forbidden" }, 403);
  }

  if (request.method === "GET") {
    const {
      data: { users },
      error,
    } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 200 });

    if (error) {
      return json({ error: "Could not load users" }, 500);
    }

    return json({
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name ?? "",
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        isAdmin: user.app_metadata?.role === "admin",
      })),
    });
  }

  if (request.method === "DELETE") {
    const { userId } = await request.json().catch(() => ({ userId: "" }));

    if (typeof userId !== "string" || !/^[0-9a-f-]{36}$/i.test(userId)) {
      return json({ error: "Invalid user ID" }, 400);
    }

    if (userId === caller.id) {
      return json({ error: "Administrators cannot delete their own active account" }, 400);
    }

    const { error } = await adminClient.auth.admin.deleteUser(userId);

    if (error) {
      return json({ error: "Could not delete user" }, 500);
    }

    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, 405);
});
