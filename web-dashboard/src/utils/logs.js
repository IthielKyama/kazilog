export function getLogDate(log) {
  return new Date(log.date || log.createdAt);
}

export function formatLogDay(date) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function groupLogsByWeek(logs) {
  const groups = new Map();

  logs.forEach((log) => {
    const date = getLogDate(log);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(date);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(date.getDate() + diff);
    const key = weekStart.toISOString().slice(0, 10);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const label = `${weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;

    if (!groups.has(key)) {
      groups.set(key, { key, label, logs: [] });
    }

    groups.get(key).logs.push(log);
  });

  return Array.from(groups.values());
}
