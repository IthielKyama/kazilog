import { format, isSameDay, parseISO, startOfWeek } from 'date-fns';

import { LogEntry, OfflineLogPayload } from '../types';

type DatedItem = Pick<LogEntry, 'date' | 'createdAt'> | Pick<OfflineLogPayload, 'capturedAt'>;

export function getEntryDate(item: DatedItem) {
  if ('capturedAt' in item) {
    return parseISO(item.capturedAt);
  }

  return parseISO(item.date || item.createdAt);
}

export function formatDayLabel(date: Date) {
  return format(date, 'EEEE, dd MMM yyyy');
}

export function formatShortDayLabel(date: Date) {
  return format(date, 'EEE, dd MMM');
}

export function groupItemsByWeek<T extends DatedItem>(items: T[]) {
  const groups = new Map<string, { key: string; label: string; items: T[] }>();

  items.forEach((item) => {
    const date = getEntryDate(item);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const key = format(weekStart, 'yyyy-MM-dd');
    const label = isSameDay(weekStart, date)
      ? `Week of ${format(weekStart, 'dd MMM yyyy')}`
      : `${format(weekStart, 'dd MMM')} - ${format(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000), 'dd MMM yyyy')}`;

    if (!groups.has(key)) {
      groups.set(key, { key, label, items: [] });
    }

    groups.get(key)?.items.push(item);
  });

  return Array.from(groups.values());
}
