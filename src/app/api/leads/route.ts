import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

const TO = "green@landscapinginnyc.com";
const FROM = "Landscaping Leads <notifications@landscapinginnyc.com>";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      phone,
      address,
      borough,
      service,
      projectSize,
      budget,
      timeline,
      description,
      source,
    } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email, and phone are required." },
        { status: 400 }
      );
    }

    // Save to Supabase
    const { error: dbError } = await supabase.from("leads").insert({
      name,
      email,
      phone,
      address: address || null,
      borough: borough || null,
      service: service || null,
      project_size: projectSize || null,
      budget: budget || null,
      timeline: timeline || null,
      description: description || null,
      source: source || "website",
    });

    if (dbError) {
      console.error("Supabase insert error:", dbError);
    }

    // Send email notification via Resend
    const sourceLabel =
      source === "free-estimate"
        ? "Free Estimate Request"
        : source === "contact"
          ? "Contact Form"
          : "Website";

    const subject = `New Landscaping Lead: ${sourceLabel} — ${name}`;

    const rows = [
      ["Name", name],
      ["Email", email],
      ["Phone", phone],
      ["Address", address],
      ["Borough/Area", borough],
      ["Service", service],
      ["Project Size", projectSize],
      ["Budget", budget],
      ["Timeline", timeline],
      ["Description", description],
      ["Source", sourceLabel],
    ]
      .filter(([, val]) => val)
      .map(
        ([label, val]) =>
          `<tr>
            <td style="padding:8px 12px;font-weight:600;color:#334155;vertical-align:top;white-space:nowrap;">${label}</td>
            <td style="padding:8px 12px;color:#475569;">${escapeHtml(String(val))}</td>
          </tr>`
      )
      .join("");

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#166534;padding:24px 32px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">
            ${sourceLabel}
          </h1>
          <p style="margin:4px 0 0;color:#bbf7d0;font-size:14px;">LandscapingInNYC.com</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;padding:24px 32px;border-radius:0 0 12px 12px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6;">
            ${rows}
          </table>
          <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;">Reply directly to this email to respond to <strong>${escapeHtml(email)}</strong></p>
        </div>
      </div>
    `;

    try {
      await resend.emails.send({
        from: FROM,
        to: TO,
        subject,
        html,
        replyTo: email,
      });
    } catch (emailErr) {
      console.error("Resend email error:", emailErr);
      // Don't fail the request if email fails — lead is still saved
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
