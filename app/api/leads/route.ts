import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, phone, bhkPreference, project, source } =
      await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const payload = {
      name,
      email,
      phone,
      message: `Project: ${project}\nBHK Preference: ${bhkPreference}\nSource: ${source}`,
    };

    // -----------------------------
    // 1️⃣ SEND TO PRIVYR
    // -----------------------------
    const privyrWebhookUrl = process.env.PRIVYR_WEBHOOK_URL;
    if (privyrWebhookUrl) {
      const privyrResponse = await fetch(privyrWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!privyrResponse.ok) console.error("Privyr submission failed");
    } else console.error("Privyr webhook missing");

    // -----------------------------
    // 2️⃣ SEND EMAIL ALERT
    // -----------------------------
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "PropYouLike <noreply@propyoulike.com>",
          to: ["propyoulike@gmail.com"],
          subject: `New Lead – ${project}`,
          html: `
            <h3>New Lead Received</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>BHK Preference:</strong> ${bhkPreference}</p>
            <p><strong>Project:</strong> ${project}</p>
            <p><strong>Source:</strong> ${source}</p>
          `,
        }),
      });
    } else console.error("RESEND_API_KEY missing");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lead submission error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
