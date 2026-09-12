import { createClient } from "@supabase/supabase-js";

async function main(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    console.log("Supabase credentials not found in environment.");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  try {
    const { count, error } = await supabase.from("pemilih").select("*", { count: "exact", head: true });
    if (error) {
      console.error("Connection check failed:", error.message);
    } else {
      console.log(`Database connected successfully. Total pemilih: ${count}`);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Connection exception:", error.message);
    }
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error("Fatal error:", error.message);
  }
});
