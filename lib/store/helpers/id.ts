const counters: Record<string, number> = {};

export function generateId(prefix: string): string {
  if (!counters[prefix]) {
    counters[prefix] = 0;
  }
  counters[prefix]++;
  return `${prefix}_${counters[prefix]}`;
}

export function initCounter(prefix: string, startFrom: number): void {
  counters[prefix] = startFrom;
}
