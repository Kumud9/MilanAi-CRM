import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Profile } from "@/lib/types";
import CustomerClient from "./CustomerClient";

export const dynamic = "force-dynamic";

interface CustomerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;
  
  const cookieStore = await cookies();
  const username = cookieStore.get("matchmaker-username")?.value;

  let dbName = "profiles.json";
  if (username && username !== "matchmaker") {
    dbName = `profiles_${username}.json`;
  }

  const filePath = path.join(process.cwd(), 'data', dbName);
  if (!fs.existsSync(filePath)) {
    return notFound();
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  const profiles: Profile[] = JSON.parse(data);

  const targetProfile = profiles.find((p) => p.id === id);

  if (!targetProfile) {
    return notFound();
  }

  return <CustomerClient targetProfile={targetProfile} allProfiles={profiles} />;
}
