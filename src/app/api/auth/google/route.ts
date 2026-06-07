import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, googleId } = body;

    if (!email || !name || !googleId) {
      return NextResponse.json({ error: "Missing required Google auth payload" }, { status: 400 });
    }

    interface UserDBEntry {
      id: string;
      username: string;
      email: string;
      name: string;
      provider?: string;
      password?: string;
    }

    const filePath = path.join(process.cwd(), 'data', 'users.json');
    let users: UserDBEntry[] = [];
    
    if (fs.existsSync(filePath)) {
      users = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    // Check if user already exists by email
    let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (user) {
      if (user.provider !== 'google') {
        return NextResponse.json(
          { error: "This email is registered with password credentials. Please use traditional Login." },
          { status: 400 }
        );
      }
    } else {
      // Register new Google SSO user in JSON database
      user = {
        id: `u_g${googleId}`,
        username: email.split('@')[0],
        email,
        name,
        provider: "google"
      };
      
      users.push(user);
      fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf-8');
    }

    return NextResponse.json(user);
  } catch (error: unknown) {
    console.error("Google SSO API error:", error);
    const message = error instanceof Error ? error.message : "Failed to authenticate Google user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
