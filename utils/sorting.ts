/**
 * Generic sorting utilities
 */

/**
 * Sort an array of items by a saved order array
 * Items not in the order array are placed at the end
 */
export function sortByOrder<T extends { id: string }>(
  items: T[],
  order: string[]
): T[] {
  if (order.length === 0) {
    return items;
  }

  const orderMap = new Map(order.map((id, index) => [id, index]));
  return [...items].sort((a, b) => {
    const indexA = orderMap.get(a.id) ?? 999;
    const indexB = orderMap.get(b.id) ?? 999;
    return indexA - indexB;
  });
}

/**
 * Extract order array from items
 */
export function extractOrder<T extends { id: string }>(items: T[]): string[] {
  return items.map((item) => item.id);
}
