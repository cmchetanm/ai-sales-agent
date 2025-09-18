export type Order = 'asc' | 'desc';

export function sortBy<T>(arr: T[], key: keyof T, order: Order = 'asc'): T[] {
  const copy = [...arr];
  copy.sort((a: any, b: any) => {
    const av = a[key];
    const bv = b[key];
    if (av == null && bv == null) return 0;
    if (av == null) return order === 'asc' ? -1 : 1;
    if (bv == null) return order === 'asc' ? 1 : -1;
    if (av < bv) return order === 'asc' ? -1 : 1;
    if (av > bv) return order === 'asc' ? 1 : -1;
    return 0;
  });
  return copy;
}

