export interface ActivityEntry {
  id: string;
  memberId: number;
  memberName: string;
  memberEmoji: string;
  memberColor: string;
  action: string;
  timestamp: number; // Date.now() ms
}

interface ActivityStore {
  entries: ActivityEntry[];
  lastSeen: Map<number, number>; // memberId → Date.now() ms
}

declare global {
  // eslint-disable-next-line no-var
  var __activityStore: ActivityStore | undefined;
}

const MAX_ENTRIES = 30;

function getStore(): ActivityStore {
  if (!globalThis.__activityStore) {
    globalThis.__activityStore = {
      entries: [],
      lastSeen: new Map(),
    };
  }
  return globalThis.__activityStore;
}

export function logActivity(
  memberId: number,
  memberName: string,
  memberEmoji: string,
  memberColor: string,
  action: string
) {
  const store = getStore();
  store.lastSeen.set(memberId, Date.now());
  store.entries.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    memberId,
    memberName,
    memberEmoji,
    memberColor,
    action,
    timestamp: Date.now(),
  });
  if (store.entries.length > MAX_ENTRIES) {
    store.entries.length = MAX_ENTRIES;
  }
}

export function touchLastSeen(memberId: number) {
  getStore().lastSeen.set(memberId, Date.now());
}

export function getActivities(): ActivityEntry[] {
  return getStore().entries;
}

export function getLastSeen(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [id, ms] of getStore().lastSeen.entries()) {
    result[String(id)] = ms;
  }
  return result;
}
