import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
const PRICE_IDS = { basic: "price_1UaKwkD3V5I3NEtSOeabfZ7j", premium: "price_1UaKx7D3V5I3NEtSdRNS5dLH" } as const;

export async function POST(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (host !== "independizar.com" && host !== "www.independizar.com") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const form = await request.formData();
  const tier = form.get("tier");
  const locale = form.get("locale") === "en" ? "en" : "es";
  if (tier !== "basic" && tier !== "premium") return NextResponse.json({ error: "Invalid membership" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const origin = "https://independizar.com";
  if (!user) return NextResponse.redirect(new URL(`/${locale}/auth/login?next=/${locale}/suscripciones`, origin), 303);
  // Never collect money until webhook verification and membership synchronization are configured.
  if (!process.env.INDEPENDIZAR_STRIPE_WEBHOOK_SECRET || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Los pagos aún no están habilitados. Vuelve pronto." }, { status: 503 });
  }
  const stripe = getStripe();
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  const customer = customers.data[0] ?? await stripe.customers.create({ email: user.email, metadata: { independizar_user_id: user.id } });
  const existing = await stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 100 });
  if (existing.data.some(s => ["active", "trialing", "past_due", "unpaid"].includes(s.status) && s.items.data.some(item => Object.values(PRICE_IDS).includes(item.price.id as typeof PRICE_IDS[keyof typeof PRICE_IDS])))) {
    return NextResponse.redirect(new URL(`/${locale}/suscripciones/gestionar`, origin), 303);
  }
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    client_reference_id: user.id,
    line_items: [{ price: PRICE_IDS[tier], quantity: 1 }],
    subscription_data: { metadata: { independizar_user_id: user.id, independizar_tier: tier } },
    metadata: { independizar_user_id: user.id, independizar_tier: tier },
    success_url: `${origin}/${locale}/suscripciones/exito?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/${locale}/suscripciones`,
    allow_promotion_codes: true,
  });
  return NextResponse.redirect(session.url!, 303);
}
