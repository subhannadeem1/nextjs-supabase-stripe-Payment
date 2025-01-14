import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'  

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2022-11-15',
})

export async function POST(req: NextRequest) {
  let event: Stripe.Event
  const buf = await req.arrayBuffer()
  const rawBody = Buffer.from(buf).toString('utf-8')
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  // 1. Verify the Stripe event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Error verifying Stripe webhook signature:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // 2. Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // This fires when a checkout session completes
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout Session completed: ', session)
        // Optionally store something here if needed
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('customer.subscription.created: ', subscription)

        // Convert UNIX timestamps to ISO date strings
        const currentPeriodStartDate = new Date(subscription.current_period_start * 1000).toISOString()
        const currentPeriodEndDate   = new Date(subscription.current_period_end * 1000).toISOString()

        // Optionally fetch customer email from Stripe if needed:
        let email: string | null = null
        if (typeof subscription.customer === 'string') {
          const customerObj = await stripe.customers.retrieve(subscription.customer)
          email = (customerObj as Stripe.Customer).email ?? null
        }

        // Get plan nickname (if set) from price
        const planName = subscription.items.data[0]?.price?.nickname ?? null

        // Insert into Supabase
        await supabase
          .from('subscriptions')
          .insert({
            stripe_customer_id: subscription.customer,
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0]?.price?.id ?? null,
            status: subscription.status,
            current_period_start: currentPeriodStartDate,
            current_period_end: currentPeriodEndDate,
            email,
            plan_name: planName
          })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('customer.subscription.updated: ', subscription)

        const currentPeriodStartDate = new Date(subscription.current_period_start * 1000).toISOString()
        const currentPeriodEndDate   = new Date(subscription.current_period_end * 1000).toISOString()

        // Possibly refetch email or skip if unchanged
        // Optionally, plan name might have changed if user switched plan
        const planName = subscription.items.data[0]?.price?.nickname ?? null

        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: currentPeriodStartDate,
            current_period_end: currentPeriodEndDate,
            plan_name: planName
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('customer.subscription.deleted: ', subscription)

        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice payment succeeded: ', invoice)
      
        const invoiceId = invoice.id
        const invoicePdf = invoice.invoice_pdf
        const invoiceEmail = invoice.customer_email
      
        // Check if invoice.subscription is a string
        console.log('Invoice subscription ID:', invoice.subscription)
      
        if (invoice.subscription) {
          const { data, error } = await supabase
            .from('subscriptions')
            .update({
              invoice_id: invoiceId,
              invoice_pdf: invoicePdf,
              email: invoiceEmail,
            })
            .eq('stripe_subscription_id', invoice.subscription)
            .select('*')
      
          console.log('Update result for invoice:', { data, error })
        }
      
        break
      }
      

      default: {
        console.log(`Unhandled event type ${event.type}`)
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err: any) {
    console.error('Error processing webhook event:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 })
  }
}
