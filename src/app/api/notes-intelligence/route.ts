import { NextRequest, NextResponse } from "next/server";
import { extractNotesInsights } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawNotes } = body;
    
    if (!rawNotes || typeof rawNotes !== 'string') {
      return NextResponse.json({ error: "Missing or invalid raw notes content" }, { status: 400 });
    }

    const insights = await extractNotesInsights(rawNotes);
    return NextResponse.json(insights);
  } catch (error: unknown) {
    console.error("Error in notes-intelligence API route:", error);
    const message = error instanceof Error ? error.message : "Failed to parse notes insights";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
