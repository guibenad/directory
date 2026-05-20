import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_BYTES = 32;
export const LOGIN_TOKEN_TTL_MIN = 15;

export function hashLoginToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function issueLoginToken(userId: string): Promise<string> {
  const raw = randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashLoginToken(raw);
  const expiresAt = new Date(Date.now() + LOGIN_TOKEN_TTL_MIN * 60 * 1000);
  await prisma.loginToken.create({
    data: { userId, tokenHash, expiresAt },
  });
  return raw;
}

export async function consumeLoginToken(raw: string): Promise<{ userId: string } | null> {
  const tokenHash = hashLoginToken(raw);
  const record = await prisma.loginToken.findUnique({ where: { tokenHash } });
  if (!record) return null;
  if (record.consumedAt) return null;
  if (record.expiresAt < new Date()) return null;
  await prisma.loginToken.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });
  return { userId: record.userId };
}
