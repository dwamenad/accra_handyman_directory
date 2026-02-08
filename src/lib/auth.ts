import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "ahd_session";

type SessionPayload = {
  userId: string;
  role: "CUSTOMER" | "HANDYMAN" | "ADMIN";
};

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  return secret;
}

export async function createSession(userId: string, role: SessionPayload["role"]) {
  const token = jwt.sign({ userId, role } as SessionPayload, getSecret(), { expiresIn: "14d" });
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
}

export function clearSession() {
  cookies().delete(COOKIE_NAME);
}

export async function getSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, getSecret()) as SessionPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.suspended) return null;
    return { user };
  } catch {
    return null;
  }
}

export async function requireAuth(role?: SessionPayload["role"]) {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  if (role && session.user.role !== role) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
