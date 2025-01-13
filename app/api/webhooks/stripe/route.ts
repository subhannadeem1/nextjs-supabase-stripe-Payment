import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2022-11-15',
})

/**
 * Because we need the raw body for verifying Stripe's signature,
 * we must read the request as an ArrayBuffer, then convert to a buffer.
 */
export async function POST(req: NextRequest) {
  let event: Stripe.Event

  // 1. Read the raw body (ArrayBuffer).
  const buf = await req.arrayBuffer()
  const rawBody = Buffer.from(buf).toString('utf-8')

  // 2. Retrieve the Stripe signature from the headers.
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  // 3. Verify the event against your STRIPE_WEBHOOK_SECRET
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Error verifying Stripe webhook signature:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // 4. Handle the event (this is where you can update Supabase or do other logic).
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        // e.g., handle a successful subscription purchase
        console.log('Checkout Session completed: ', session)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        // e.g., handle invoice payment succeeded
        console.log('Invoice payment succeeded: ', invoice)
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        // e.g., handle subscription update/cancellation
        console.log(`Subscription event [${event.type}]: `, subscription)
        break
      }

      default:
        // Other event types: https://stripe.com/docs/api/events/types
        console.log(`Unhandled event type ${event.type}`)
    }

    // 5. Return a 200 response to acknowledge receipt of the event
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err: any) {
    // If something goes wrong internally, return 400 so Stripe will try again
    console.error('Error processing webhook event:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 })
  }
}
