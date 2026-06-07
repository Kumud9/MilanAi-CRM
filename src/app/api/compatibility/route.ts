import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { generateCompatibilityAnalysis } from "@/lib/openai";
import { Profile } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetId, candidateId, score, reasons } = body;
    
    if (!targetId || !candidateId) {
      return NextResponse.json({ error: "Missing required profile IDs" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const username = cookieStore.get("matchmaker-username")?.value;

    let dbName = "profiles.json";
    if (username && username !== "matchmaker") {
      dbName = `profiles_${username}.json`;
    }

    const filePath = path.join(process.cwd(), 'data', dbName);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Database file not found" }, { status: 500 });
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    const profiles: Profile[] = JSON.parse(data);

    const target = profiles.find(p => p.id === targetId);
    const candidate = profiles.find(p => p.id === candidateId);

    if (!target || !candidate) {
      return NextResponse.json({ error: "Profiles not found" }, { status: 404 });
    }

    const analysis = await generateCompatibilityAnalysis(target, candidate, score, reasons);
    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error("Error in compatibility API route:", error);
    const message = error instanceof Error ? error.message : "Failed to generate compatibility report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
