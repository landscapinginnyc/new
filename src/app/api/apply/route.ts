import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

const TO = "green@landscapinginnyc.com";
const FROM = "Landscaping Applications <notifications@landscapinginnyc.com>";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const position = formData.get("position") as string;
    const borough = formData.get("borough") as string | null;
    const experience = formData.get("experience") as string | null;
    const availability = formData.get("availability") as string | null;
    const driversLicense = formData.get("driversLicense") as string | null;
    const about = formData.get("about") as string | null;
    const resumeFile = formData.get("resume") as File | null;
    const videoFile = formData.get("video") as File | null;

    if (!name || !email || !phone || !position) {
      return NextResponse.json(
        { error: "Name, email, phone, and position are required." },
        { status: 400 }
      );
    }

    if (!videoFile) {
      return NextResponse.json(
        { error: "Selfie video is required." },
        { status: 400 }
      );
    }

    // Upload video to Supabase Storage
    const timestamp = Date.now();
    const safeName = name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

    let videoUrl = "";
    if (videoFile) {
      const videoExt = videoFile.name.split(".").pop() || "mp4";
      const videoPath = `applications/${safeName}-${timestamp}/video.${videoExt}`;
      const videoBuffer = Buffer.from(await videoFile.arrayBuffer());

      const { error: videoError } = await supabase.storage
        .from("uploads")
        .upload(videoPath, videoBuffer, {
          contentType: videoFile.type,
          upsert: true,
        });

      if (videoError) {
        console.error("Video upload error:", videoError);
        return NextResponse.json({ error: "Failed to upload video." }, { status: 500 });
      }

      const { data: videoUrlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(videoPath);
      videoUrl = videoUrlData.publicUrl;
    }

    let resumeUrl = "";
    if (resumeFile) {
      const resumeExt = resumeFile.name.split(".").pop() || "pdf";
      const resumePath = `applications/${safeName}-${timestamp}/resume.${resumeExt}`;
      const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());

      const { error: resumeError } = await supabase.storage
        .from("uploads")
        .upload(resumePath, resumeBuffer, {
          contentType: resumeFile.type,
          upsert: true,
        });

      if (resumeError) {
        console.error("Resume upload error:", resumeError);
        // Don't fail — video is more important
      } else {
        const { data: resumeUrlData } = supabase.storage
          .from("uploads")
          .getPublicUrl(resumePath);
        resumeUrl = resumeUrlData.publicUrl;
      }
    }

    // Save application to Supabase
    const { error: dbError } = await supabase.from("applications").insert({
      name,
      email,
      phone,
      position,
      borough: borough || null,
      experience: experience || null,
      availability: availability || null,
      drivers_license: driversLicense || null,
      about: about || null,
      video_url: videoUrl,
      resume_url: resumeUrl || null,
      source: "website",
    });

    if (dbError) {
      console.error("Supabase insert error:", dbError);
    }

    // Send email notification
    const rows = [
      ["Name", name],
      ["Email", email],
      ["Phone", phone],
      ["Position", position],
      ["Borough", borough],
      ["Experience", experience],
      ["Availability", availability],
      ["Driver's License", driversLicense],
      ["About", about],
      ["Video", videoUrl ? `<a href="${videoUrl}" style="color:#16a34a;">Watch Video</a>` : "Not uploaded"],
      ["Resume", resumeUrl ? `<a href="${resumeUrl}" style="color:#16a34a;">Download Resume</a>` : "Not uploaded"],
    ]
      .filter(([, val]) => val)
      .map(
        ([label, val]) =>
          `<tr>
            <td style="padding:8px 12px;font-weight:600;color:#334155;vertical-align:top;white-space:nowrap;">${label}</td>
            <td style="padding:8px 12px;color:#475569;">${val}</td>
          </tr>`
      )
      .join("");

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#166534;padding:24px 32px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">
            New Job Application: ${escapeHtml(position)}
          </h1>
          <p style="margin:4px 0 0;color:#bbf7d0;font-size:14px;">LandscapingInNYC.com</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;padding:24px 32px;border-radius:0 0 12px 12px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6;">
            ${rows}
          </table>
          <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;">Reply to this email to contact <strong>${escapeHtml(email)}</strong></p>
        </div>
      </div>
    `;

    try {
      await resend.emails.send({
        from: FROM,
        to: TO,
        subject: `New Application: ${position} — ${name}`,
        html,
        replyTo: email,
      });
    } catch (emailErr) {
      console.error("Resend email error:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Application error:", err);
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
