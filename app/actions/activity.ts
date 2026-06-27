"use server";

import { getActivities, getLastSeen } from "@/lib/activityStore";
import { ActionResult, tryAction } from "./shared";

export async function getActivityFeed() {
  return getActivities();
}

export async function getMembersLastSeen() {
  return getLastSeen();
}
