import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { touchLastSeen, getLastSeen } from "@/lib/activityStore";

export async function POST() {
  const cookieStore = await cookies();
  const rawId = cookieStore.get("family-member-id")?.value;

  if (rawId) {
    const memberId = parseInt(rawId, 10);
    if (!isNaN(memberId)) {
      // Verify member exists before touching
      const member = await prisma.member.findUnique({ where: { id: memberId }, select: { id: true } });
      if (member) {
        touchLastSeen(memberId);
      }
    }
  }

  return Response.json(getLastSeen());
}
