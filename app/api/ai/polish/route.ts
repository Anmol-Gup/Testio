import { NextResponse } from "next/server";
import dns from "dns";

// Fix for fetch failed errors in some Node environments
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY?.trim();
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not defined in environment variables");
            return NextResponse.json({ error: "AI configuration error. Please contact support." }, { status: 500 });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Rewrite this testimonial to be more polished and professional, but keep it concise and authentic. If it's already good, just return it. Output ONLY the rewritten text.\n\nTestimonial: ${text}`
                    }]
                }]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'AI request failed');
        }

        const result = await response.json();
        const polishedText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;

        return NextResponse.json({ polishedText });
    } catch (error: any) {
        console.error("AI Polish Detailed Error:", {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });
        return NextResponse.json({ error: error.message || "Failed to process AI request" }, { status: 500 });
    }
}
