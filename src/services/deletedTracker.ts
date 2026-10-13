// Helper to persistently track deleted item IDs across tabs and Firestore snapshots
// Prevents deleted items from resurrecting when offline or during mergeWithLocalCache reconciliation

const DELETED_IDS_KEY = 'kmu_deleted_item_ids';

export function getDeletedItemIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function markItemAsDeleted(id: string): void {
  if (!id) return;
  try {
    const current = getDeletedItemIds();
    current.add(id);
    // Keep max 2000 IDs to avoid localStorage overflow
    const arr = Array.from(current);
    if (arr.length > 2000) {
      arr.splice(0, arr.length - 2000);
    }
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(arr));
  } catch (err) {
    console.warn('Failed to record deleted item ID:', err);
  }
}

export function isItemDeleted(id: string): boolean {
  if (!id) return false;
  return getDeletedItemIds().has(id);
}
