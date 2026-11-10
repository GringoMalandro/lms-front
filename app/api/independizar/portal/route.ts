import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (host !== "independizar.com" && host !== "www.independizar.com") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const form = await request.formData();
  const locale = form.get("locale") === "en" ? "en" : "es";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const origin = "https://independizar.com";
  if (!user?.email) return NextResponse.redirect(new URL(`/${locale}/auth/login`, origin), 303);
  const stripe = getStripe();
  const customers = await stripe.customers.list({ email: user.email, limit: 100 });
  const customer = customers.data.find(c => c.metadata?.independizar_user_id === user.id);
  if (!customer) return NextResponse.redirect(new URL(`/${locale}/suscripciones`, origin), 303);
  const session = await stripe.billingPortal.sessions.create({ customer: customer.id, return_url: `${origin}/${locale}/suscripciones/gestionar` });
  return NextResponse.redirect(session.url, 303);
}
