import fs from "fs";
import path from "path";
import React, { Suspense } from "react";
import { cookies } from "next/headers";
import { Profile } from "@/lib/types";
import DashboardClient from "./DashboardClient";

// Force dynamic rendering since we are reading from the filesystem database
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const username = cookieStore.get("matchmaker-username")?.value;

  let dbName = "profiles.json";
  if (username && username !== "matchmaker") {
    dbName = `profiles_${username}.json`;
  }

  const dataDir = path.join(process.cwd(), 'data');
  const filePath = path.join(dataDir, dbName);
  
  let profiles: Profile[] = [];
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      profiles = JSON.parse(data);
    } else {
      // If user-specific file does not exist, write empty array
      if (dbName !== "profiles.json") {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
      }
    }
  } catch (error) {
    console.error("Error reading profiles data inside Server Component:", error);
  }

  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-background text-foreground font-medium">Loading Workstation...</div>}>
      <DashboardClient initialProfiles={profiles} />
    </Suspense>
  );
}
