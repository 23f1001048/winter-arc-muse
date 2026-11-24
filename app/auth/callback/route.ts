import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles email-confirmation / magic-link redirects from Supabase Auth.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/calendar";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination = new URL("/calendar", origin);
      if (next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) {
        const requested = new URL(next, origin);
        if (requested.origin === origin) return NextResponse.redirect(requested);
      }
      return NextResponse.redirect(destination);
    }
  }
  return NextResponse.redirect(`${origin}/login`);
}
