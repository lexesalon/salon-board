import { Redis } from "@upstash/redis";
import bcrypt from "bcryptjs";
import { signToken } from "../../../lib/auth";
import { cookies } from "next/headers";

const redis = Redis.fromEnv();

export async function POST(req) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return Response.json({ error: "ユーザー名とパスワードを入力してください" }, { status: 400 });
  }

  const user = await redis.hgetall(`user:${username}`);
  if (!user) {
    return Response.json({ error: "ユーザー名またはパスワードが違います" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return Response.json({ error: "ユーザー名またはパスワードが違います" }, { status: 401 });
  }

  const token = await signToken({ username, role: user.role, displayName: user.displayName });

  cookies().set("salon_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return Response.json({ ok: true, role: user.role, displayName: user.displayName });
}
