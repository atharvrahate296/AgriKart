# Supabase Custom Email Template Setup

This guide explains how to inject the branded AgriKart email templates into your Supabase project for the **Email Verification** flow.

> **Note:** The **password reset / OTP** flow uses our custom Nodemailer SMTP (no Supabase config needed — it works out of the box). This guide only covers the Supabase-managed email verification link.

---

## Part 1 — Enable Custom SMTP (Recommended)

By default, Supabase sends emails from `noreply@mail.supabase.io` with a 3 emails/hour rate limit. Connecting your own SMTP lifts this limit and enables the custom template.

### Steps

1. **Go to your Supabase Dashboard** → [https://supabase.com/dashboard/project/tcrlybipcykbvsshmdmn/settings/auth](https://supabase.com/dashboard/project/tcrlybipcykbvsshmdmn/settings/auth)

2. **Scroll to "SMTP Settings"** and toggle **Enable Custom SMTP** to ON.

3. **Fill in your SMTP credentials** (matches your `.env`):

   | Field | Value |
   |---|---|
   | Host | `smtp.gmail.com` |
   | Port | `587` |
   | Username | `atharvdrahate@gmail.com` |
   | Password | Your Gmail App Password (`jcvx xusv cbzw hxti`) |
   | Sender Email | `atharvdrahate@gmail.com` |
   | Sender Name | `AgriKart` |

4. **Click Save** and send a test email to verify.

---

## Part 2 — Inject the Custom Email Template

### Step 1: Copy the HTML

Open [`backend/src/services/email/templates/verification.html`](file:///c:/Users/victus/Documents/Hackathons/Automatex/backend/src/services/email/templates/verification.html) and copy the entire HTML content.

### Step 2: Paste into Supabase Dashboard

1. Go to **Authentication → Email Templates** in your Supabase Dashboard.
2. Select **"Confirm signup"** from the template dropdown.
3. Paste the HTML into the **Body** field.
4. Set the **Subject** to: `✅ Verify your AgriKart account`
5. Ensure `{{ .ConfirmationURL }}` is present — Supabase replaces this with the real link at send time.
6. Click **Save**.

> Repeat for the **"Magic Link"** template if you use magic link auth.

### Step 3: Set Site URL

1. Go to **Authentication → URL Configuration**.
2. Set **Site URL** to: `http://localhost:3000` (or your production URL).
3. Add `http://localhost:3000/**` to **Redirect URLs**.

---

## Part 3 — Password Reset Email (via Nodemailer — already working)

The password reset flow uses our custom OTP system via Nodemailer:
- Template: [`backend/src/services/email/templates/password-reset.html`](file:///c:/Users/victus/Documents/Hackathons/Automatex/backend/src/services/email/templates/password-reset.html)
- This is **automatically loaded** by [`emailService.ts`](file:///c:/Users/victus/Documents/Hackathons/Automatex/backend/src/services/email/emailService.ts) — no Supabase config needed.
- The `{{OTP_CODE}}` placeholder is replaced at runtime.

---

## Part 4 — Supabase CLI Alternative (Advanced)

If you prefer declarative config over the dashboard UI, Supabase supports custom email templates via `config.toml` (local development only):

```toml
# supabase/config.toml
[auth.email.template.confirmation]
subject = "✅ Verify your AgriKart account"
content_path = "./templates/verification.html"
```

```bash
# Apply config locally
supabase start
supabase db push
```

> **Limitation:** This only works with `supabase start` (local Docker). Production templates must be set via the Dashboard.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Email not received | Gmail "Less secure apps" blocked | Use App Password, not account password |
| `Invalid login` SMTP error | Wrong app password format | Remove spaces: `jcvxxusvbzwhxti` |
| Template not showing custom HTML | Supabase free tier custom SMTP not enabled | Enable it in Auth Settings |
| `Confirmation URL invalid` | Site URL not configured | Set Site URL in URL Configuration |
| OTP email arriving but link-based email not | Both flows active simultaneously | Pick one: OTP via Nodemailer OR link via Supabase |
