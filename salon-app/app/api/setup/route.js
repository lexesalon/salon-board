import { Redis } from "@upstash/redis";
import bcrypt from "bcryptjs";

const redis = Redis.fromEnv();

export async function POST(req) {
  const { secret, users } = await req.json();

  if (secret !== process.env.SETUP_SECRET) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await redis.hset(`user:${u.username}`, {
      passwordHash,
      displayName: u.displayName,
      role: u.role || "staff",
    });
    if (u.role !== "owner") {
      await redis.sadd("staff_list", u.username);
    }
  }

  return Response.json({ ok: true, created: users.map(u => u.username) });
}
