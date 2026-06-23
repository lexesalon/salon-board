import { cookies } from "next/headers";

export async function POST() {
  cookies().delete("salon_token");
  return Response.json({ ok: true });
}
