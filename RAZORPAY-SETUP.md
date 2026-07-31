# Razorpay setup

Four steps. Nothing here goes in the repo except the Key ID.

## Why there are two Edge Functions

A static site cannot take payments safely on its own. Two things must never
reach the browser:

- the **Razorpay key secret**, and
- the **decision about how much to charge**.

So `razorpay-create-order` reads the price from the database and creates the
order, and `razorpay-webhook` is the only thing in the system allowed to grant
access — after Razorpay's HMAC signature verifies.

> **What this replaced.** `payment-success.html` used to grant access whenever
> the URL said `?payment_status=success`. Anyone who typed
> `payment-success.html?course=<id>&payment_status=success` would have got a
> free exam. The only reason nobody did is that an unrelated RLS rule was
> blocking the write. That path is gone, and `fix_2026-08-01.sql` deliberately
> does **not** grant students INSERT on `enrollments`.

## 1. Deploy the functions

Supabase Dashboard → **Edge Functions** → **Deploy a new function**, twice.
Paste the file contents; the name must match the folder name exactly.

| Function | File | Verify JWT |
| --- | --- | --- |
| `razorpay-create-order` | `supabase/functions/razorpay-create-order/index.ts` | **ON** |
| `razorpay-webhook` | `supabase/functions/razorpay-webhook/index.ts` | **OFF** |

`Verify JWT` must be **off** for the webhook — Razorpay does not send a
Supabase token. Its authentication is the HMAC signature, which the function
checks before trusting a single field.

## 2. Set the secrets

Supabase Dashboard → Edge Functions → **Secrets**:

| Name | Value | From |
| --- | --- | --- |
| `RAZORPAY_KEY_ID` | `rzp_test_...` | Razorpay → Account & Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | shown once at key creation | same screen |
| `RAZORPAY_WEBHOOK_SECRET` | a string you choose in step 3 | you invent it |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically —
do not add them.

**The Key Secret must never be committed, pasted into config.js, or sent in
chat.** If it is ever exposed, regenerate it in the Razorpay dashboard.

## 3. Create the webhook

Razorpay Dashboard → Settings → **Webhooks** → Add New Webhook.

- **URL**

      https://yzmctktxzpzdfhdubwjs.supabase.co/functions/v1/razorpay-webhook

- **Secret** — type any strong string, then put the *same* string into
  `RAZORPAY_WEBHOOK_SECRET` in step 2. They must match exactly.
- **Active events**: `payment.captured`, `order.paid`, `payment.failed`

## 4. Run the SQL

`supabase/fix_2026-08-01.sql` — it sets the read policies, corrects the price
to Rs 329 / 15 days, and derives `is_live` from question counts. It no longer
grants any client-side write.

## Testing in test mode

With `rzp_test_` keys, use Razorpay's test instruments — for example card
`4111 1111 1111 1111`, any future expiry, any CVV, OTP `1234`. No real money
moves.

What should happen:

1. Buy an exam from `checkout.html`. Razorpay opens in-page.
2. Pay. You land on `payment-success.html`, which **polls** — it grants
   nothing itself.
3. Within a few seconds the webhook fires, the enrollment appears, and the
   page flips to "Payment confirmed".
4. `payments` has a row that went `created` → `paid`.

If step 3 does not happen, look at Supabase → Edge Functions → `razorpay-webhook`
→ Logs. A `401 invalid signature` means the webhook secret does not match
step 2. Razorpay's own Webhooks screen shows delivery attempts and retries.

## Going live

1. Complete Razorpay KYC and generate **live** keys.
2. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to the `rzp_live_` pair.
3. Add a second webhook pointing at the same URL from the live-mode dashboard
   (test and live webhooks are configured separately) and set its secret.

Nothing in this repo needs to change — the Key ID is served to the browser by
the create-order function, not hardcoded.

## Safeguards already in the code

- Price and access duration are read from the database, never from the client.
- An exam with **zero questions cannot be bought**, enforced in the function
  and not only in the UI.
- Buying an exam you already have active access to is refused, rather than
  charging twice.
- A repeat webhook (Razorpay retries until it gets a 2xx) extends nothing
  twice — the update is keyed on `order_id`.
- Re-buying after expiry extends from *now*; re-buying while still active
  extends from the existing expiry, so no paid days are lost.
