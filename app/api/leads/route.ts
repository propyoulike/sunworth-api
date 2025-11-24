import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, phone, bhkPreference, project, source } = await req.json();

    console.log("Received lead:", { name, email, phone, bhkPreference, project, source });

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    // -----------------------------
    // 1️⃣ Send lead to Privyr
    // -----------------------------
    const privyrWebhookUrl = process.env.PRIVYR_WEBHOOK_URL;

    if (privyrWebhookUrl) {
      try {
        const privyrResponse = await fetch(privyrWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            phone,
            message: `Project: ${project}\nBHK Preference: ${bhkPreference}\nSource: ${source}`,
          }),
        });

        console.log("Privyr response status:", privyrResponse.status);
        if (!privyrResponse.ok) {
          console.error("Privyr submission failed:", await privyrResponse.text());
        }
      } catch (err) {
        console.error("Privyr fetch error:", err);
      }
    } else {
      console.error("Privyr webhook URL missing");
    }

    // -----------------------------
    // 2️⃣ Send email via Resend
    // -----------------------------
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (RESEND_API_KEY) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
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

        console.log("Resend email response status:", emailResponse.status);
        if (!emailResponse.ok) {
          console.error("Resend email failed:", await emailResponse.text());
        }
      } catch (err) {
        console.error("Resend fetch error:", err);
      }
    } else {
      console.error("Resend API key missing");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lead submission error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
