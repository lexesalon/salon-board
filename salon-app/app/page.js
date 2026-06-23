import { getSession } from "../lib/auth";
import { redirect } from "next/navigation";
import AppClient from "../components/AppClient";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <AppClient initialSession={session} />;
}
