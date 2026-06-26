// Shared transactional-email sender. Uses Resend (https://resend.com) via a
// plain HTTPS call — no SDK needed. No-ops gracefully (returns {sent:false})
// until RESEND_API_KEY is set, so callers can fire-and-forget without breaking
// when email isn't configured yet.
//
// Setup to go live:
//   1. Create a Resend account, verify your sending domain.
//   2. Add RESEND_API_KEY (and optionally EMAIL_FROM, e.g.
//      "EzParts <orders@yourdomain.com>") to the Netlify environment.

async function sendEmail({ to, subject, html, text }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "EzParts <onboarding@resend.dev>";
  if (!key || !to) return { sent: false, reason: !key ? "no_key" : "no_recipient" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text: text || undefined }),
    });
    if (!res.ok) return { sent: false, reason: "http_" + res.status };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e.message };
  }
}

module.exports = { sendEmail };
