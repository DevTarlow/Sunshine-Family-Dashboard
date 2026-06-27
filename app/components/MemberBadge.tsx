"use client";

import { useMemberPresence } from "@/app/components/MemberPresenceContext";

interface MemberBadgeProps {
  member: { id?: number; name: string; emoji: string; color: string } | null;
}

const colorMap: Record<string, string> = {
  blue:   "bg-blue-100   text-blue-700   dark:bg-blue-900/60   dark:text-blue-200",
  red:    "bg-red-100    text-red-700    dark:bg-red-900/60    dark:text-red-200",
  green:  "bg-green-100  text-green-700  dark:bg-green-900/60  dark:text-green-200",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-200",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-200",
  pink:   "bg-pink-100   text-pink-700   dark:bg-pink-900/60   dark:text-pink-200",
  yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-200",
  teal:   "bg-teal-100   text-teal-700   dark:bg-teal-900/60   dark:text-teal-200",
};

function PresenceDot({ memberId }: { memberId?: number }) {
  const lastSeen = useMemberPresence(memberId);
  if (lastSeen === null) return null;
  const diff = Date.now() - lastSeen;
  const TEN_MINUTES = 10 * 60 * 1000;
  const ONE_DAY = 24 * 60 * 60 * 1000;
  if (diff < TEN_MINUTES) {
    return <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />;
  }
  if (diff < ONE_DAY) {
    return <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />;
  }
  return null;
}

export default function MemberBadge({ member }: MemberBadgeProps) {
  if (!member) {
    return (
      <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400 font-medium">
        Shared
      </span>
    );
  }

  const colorClasses = colorMap[member.color] ?? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${colorClasses}`}
    >
      <PresenceDot memberId={member.id} />
      <span>{member.emoji}</span>
      <span>{member.name}</span>
    </span>
  );
}
