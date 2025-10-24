import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1時間 = 60分
const MINUTES = Number(Deno.env.get("CLEANUP_MINUTES") ?? "60");

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const cutoff = new Date(Date.now() - MINUTES * 60 * 1000);
  let deleted = 0;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return new Response(error.message, { status: 500 });
    if (!data?.users.length) break;

    for (const u of data.users) {
      const isUnconfirmed = !u.email_confirmed_at;
      const createdAt = new Date(u.created_at);
      if (isUnconfirmed && createdAt < cutoff) {
        await supabase.auth.admin.deleteUser(u.id, { shouldSoftDelete: true });
        deleted++;
      }
    }
    page++;
  }

  return new Response(JSON.stringify({ deleted, cutoff: cutoff.toISOString() }), {
    headers: { "Content-Type": "application/json" },
  });
});