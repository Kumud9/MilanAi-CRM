import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, name } = body;

    if (!username || !email || !password || !name) {
      return NextResponse.json({ error: "Missing required registration parameters" }, { status: 400 });
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

    // Check if user already exists
    const userExists = users.some(
      (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
    );

    if (userExists) {
      return NextResponse.json({ error: "Username or Email is already registered" }, { status: 400 });
    }

    const newUser: UserDBEntry = {
      id: `u_${Math.random().toString(36).substring(2, 9)}`,
      username,
      password, // Plain text storage for simulated local database CRM
      email,
      name,
      provider: "credentials"
    };

    users.push(newUser);
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf-8');

    // Return the safe user object omitting password
    const safeUser = { ...newUser };
    delete safeUser.password;
    return NextResponse.json(safeUser);
  } catch (error: unknown) {
    console.error("Registration API error:", error);
    const message = error instanceof Error ? error.message : "Failed to register user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
