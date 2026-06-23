import { Redis } from "@upstash/redis";
import { getSession } from "../../../lib/auth";

const redis = Redis.fromEnv();

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { username, role } = session;

  if (role === "owner") {
    const staffList = await redis.smembers("staff_list") || [];
    const allData = [];
    for (const staff of staffList) {
      const data = await redis.get(`sales:${staff}`) || [];
      allData.push(...data.map(r => ({ ...r, staffName: staff })));
    }
    return Response.json({ ok: true, data: allData, role: "owner" });
  }

  const data = await redis.get(`sales:${username}`) || [];
  return Response.json({ ok: true, data, role: "staff", displayName: session.displayName });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = session;
  const { data } = await req.json();

  await redis.set(`sales:${username}`, data);
  return Response.json({ ok: true });
}
