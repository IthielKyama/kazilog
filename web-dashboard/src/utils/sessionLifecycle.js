export function normalizeFinalGrade(value) {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';

  if (!raw || raw === 'pending') return 'Pending';
  if (raw === 'pass') return 'Pass';
  if (raw === 'fail') return 'Fail';
  if (['a', 'b', 'c', 'd'].includes(raw)) return 'Pass';
  if (['e', 'f'].includes(raw)) return 'Fail';

  return 'Pending';
}

export function getWeekProgressLabel(session) {
  return session?.weekProgress?.label || 'Week -/-';
}

export function getSessionStatusTone(statusCode) {
  switch (statusCode) {
    case 'graded':
      return 'bg-emerald-100 text-emerald-700';
    case 'completed_awaiting_grading':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-blue-100 text-blue-800';
  }
}

export function getFinalGradeTone(value) {
  const grade = normalizeFinalGrade(value);

  if (grade === 'Pass') {
    return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  }

  if (grade === 'Fail') {
    return 'bg-rose-50 border-rose-200 text-rose-700';
  }

  return 'bg-amber-50 border-amber-200 text-amber-700';
}
