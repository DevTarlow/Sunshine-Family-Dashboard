"use client";

import { useState } from "react";
import ProfileModal from "./ProfileModal";

interface Member {
  id: number;
  name: string;
  emoji: string;
  color: string;
  backgroundImage?: string | null;
  createdAt: Date | string;
}

interface ProfileModalTriggerProps {
  member: Member;
}

export default function ProfileModalTrigger({ member }: ProfileModalTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
        title="View your profile"
      >
        <span className="text-xl">{member.emoji}</span>
        {member.name}
      </button>
      <ProfileModal
        member={member}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
