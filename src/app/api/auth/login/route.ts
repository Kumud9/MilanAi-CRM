import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
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

    // Find matching user with case-insensitive check
    const user = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const safeUser = { ...user };
    delete safeUser.password;
    return NextResponse.json(safeUser);
  } catch (error: unknown) {
    console.error("Login API error:", error);
    const message = error instanceof Error ? error.message : "Failed to login";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
