import { prisma } from "@/lib/prisma";

/** Creates an in-app notification for every user following any of the given teams. */
export async function notifyFavoriteTeamFollowers(teamIds: string[], message: string, link?: string) {
  const followers = await prisma.favoriteTeam.findMany({
    where: { teamId: { in: teamIds } },
    select: { userId: true },
    distinct: ["userId"],
  });
  if (followers.length === 0) return;

  await prisma.notification.createMany({
    data: followers.map((f) => ({ userId: f.userId, message, link })),
  });
}
