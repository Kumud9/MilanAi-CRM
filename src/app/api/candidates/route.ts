import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const profile: Profile = await req.json();
    
    const cookieStore = await cookies();
    const username = cookieStore.get("matchmaker-username")?.value;

    let dbName = "profiles.json";
    if (username && username !== "matchmaker") {
      dbName = `profiles_${username}.json`;
    }

    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, dbName);
    
    let profiles: Profile[] = [];
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      profiles = JSON.parse(data);
    }
    
    // Validate uniqueness
    if (profiles.some(p => p.id === profile.id)) {
      return NextResponse.json({ error: "Profile ID already exists" }, { status: 400 });
    }
    
    profiles.push(profile);
    fs.writeFileSync(filePath, JSON.stringify(profiles, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true, profile });
  } catch (err) {
    console.error("Failed to add candidate:", err);
    return NextResponse.json({ error: "Failed to write candidate record to system registry." }, { status: 500 });
  }
}
