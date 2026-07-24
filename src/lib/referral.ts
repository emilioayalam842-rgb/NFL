import { prisma } from "@/lib/prisma";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I, easier to type

function randomCode(length = 7) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

/** Returns the user's referral code, generating and persisting one on first use. */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.referralCode) return user.referralCode;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (existing) continue;

    await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
    return code;
  }

  throw new Error("No se pudo generar un código de referido único.");
}
