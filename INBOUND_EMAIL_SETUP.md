# How to Configure Inbound Email Replies (SendGrid Example)

To allow patients to reply to your emails and have those messages appear in your CareOps Inbox, you need to set up an **"Inbound Parse Webhook"**.

This guide uses **SendGrid** as an example, but the steps are similar for Mailgun or Postmark.

## Prerequisites
1.  **A Deployed App**: Your application must be live on the internet (e.g., on Vercel) so it has a public URL like `https://careops-app.vercel.app`.
2.  **A Custom Domain**: You need a domain (e.g., `careops.com` or `replies.careops.com`) to receive emails.

---

## Step 1: Authenticate Your Domain
1.  Log in to your **SendGrid** account.
2.  Go to **Settings** > **Sender Authentication**.
3.  Click **Authenticate Your Domain**.
4.  Follow the instructions to add the CNAME records to your DNS provider (GoDaddy, Namecheap, etc.).

## Step 2: Point MX Records (The "Postman")
You need to tell the internet "Send emails for this domain to SendGrid".
1.  Go to your DNS Provider (where you bought your domain).
2.  Add an **MX Record**:
    *   **Host/Name**: `@` (or `replies` if using a subdomain).
    *   **Value**: `mx.sendgrid.net`
    *   **Priority**: `10`

## Step 3: Configure the Inbound Parse Webhook
This tells SendGrid: "When you get an email, send it to my CareOps app."
1.  In SendGrid, go to **Settings** > **Inbound Parse**.
2.  Click **Add Host & URL**.
3.  **Subdomain**: Enter the domain/subdomain you set up MX records for (e.g., `careops.com` or `replies.careops.com`).
4.  **Destination URL**: Enter your app's webhook URL:
    *   `https://YOUR-DEPLOYED-APP.com/api/webhooks/email`
5.  Click **Add**.

## Step 4: Test It
1.  Send an email from your personal Gmail to any address at your domain (e.g., `anything@careops.com`).
2.  SendGrid will receive it.
3.  SendGrid will POST the email data to your `/api/webhooks/email` endpoint.
4.  Check your CareOps **Inbox**. The message should appear!

---

## Troubleshooting
*   **"I don't see the message."**
    *   Check your `Vercel Function Logs` (or server logs) to see if the webhook hit your app.
    *   Ensure your `api/webhooks/email/route.js` is not crashing (errors like 500 meant something broke).
*   **"My domain handles valid business email, I don't want to break it."**
    *   **Use a Subdomain**: Set up `replies.yourdomain.com`.
    *   Point MX records ONLY for `replies` to SendGrid.
    *   Configure your app to send emails *from* `support@replies.yourdomain.com`.
