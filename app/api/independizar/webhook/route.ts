import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const ALLOWED = new Set(["price_1UaKwkD3V5I3NEtSOeabfZ7j", "price_1UaKx7D3V5I3NEtSdRNS5dLH"]);

async function syncSubscription(subscription: Stripe.Subscription) {
  let userId = subscription.metadata?.independizar_user_id;\n  if (!userId) {\n    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;\n    const customer = await getStripe().customers.retrieve(customerId);\n    if (!customer.deleted) userId = customer.metadata?.independizar_user_id;\n  }
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return;
  const priceId = subscription.items.data.find(item => ALLOWED.has(item.price.id))?.price.id;
  if (!priceId) return;
  const admin = createAdminClient();
  const { data: plan, error: planError } = await admin.from("plans").select("id").eq("stripe_price_id", priceId).single();
  if (planError || !plan) throw new Error("Independizar plan mapping missing");
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const periodEnd = subscription.items.data.find(item => ALLOWED.has(item.price.id))?.current_period_end;
  const { error } = await admin.from("subscriptions").upsert({
    user_id: userId,
    plan_id: plan.id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    status: subscription.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
  }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function POST(request: NextRequest) {
  const secret = process.env.INDEPENDIZAR_STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  try {
    if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      await syncSubscription(event.data.object as Stripe.Subscription);
    } else if (["invoice.paid", "invoice.payment_failed"].includes(event.type)) {
      const invoice = event.data.object as Stripe.Invoice;
      const parent = invoice.parent?.subscription_details?.subscription;
      const subscriptionId = typeof parent === "string" ? parent : parent?.id;
      if (subscriptionId) {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        await syncSubscription(subscription);
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Independizar webhook sync failed", error);
    return NextResponse.json({ error: "Synchronization failed" }, { status: 500 });
  }
}
