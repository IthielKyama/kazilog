const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcDayValue(input) {
  const date = input instanceof Date ? input : new Date(input);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function normalizeFinalGradeValue(value) {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';

  if (!raw || raw === 'pending') return 'Pending';
  if (raw === 'pass') return 'Pass';
  if (raw === 'fail') return 'Fail';

  // Legacy grade compatibility: existing A-D grades are treated as pass, E/F as fail.
  if (['a', 'b', 'c', 'd'].includes(raw)) return 'Pass';
  if (['e', 'f'].includes(raw)) return 'Fail';

  return 'Pending';
}

function calculateWeekProgress(startDate, endDate, now = new Date()) {
  const startDay = toUtcDayValue(startDate);
  const endDay = toUtcDayValue(endDate);
  const currentDay = toUtcDayValue(now);

  const totalDays = Math.max(1, Math.floor((endDay - startDay) / MS_PER_DAY) + 1);
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));

  if (currentDay <= startDay) {
    return {
      currentWeek: 1,
      totalWeeks,
      label: `Week 1/${totalWeeks}`,
      isCompletedByDate: false,
    };
  }

  if (currentDay > endDay) {
    return {
      currentWeek: totalWeeks,
      totalWeeks,
      label: `Week ${totalWeeks}/${totalWeeks}`,
      isCompletedByDate: true,
    };
  }

  const elapsedDays = Math.floor((currentDay - startDay) / MS_PER_DAY);
  const currentWeek = Math.min(totalWeeks, Math.floor(elapsedDays / 7) + 1);

  return {
    currentWeek,
    totalWeeks,
    label: `Week ${currentWeek}/${totalWeeks}`,
    isCompletedByDate: false,
  };
}

function getSessionLifecycle(session, now = new Date()) {
  const finalGrade = normalizeFinalGradeValue(session.finalGrade);
  const weekProgress = calculateWeekProgress(session.startDate, session.endDate, now);
  const isGraded = finalGrade !== 'Pending';
  const isActive = !isGraded && !weekProgress.isCompletedByDate;

  if (isGraded) {
    return {
      finalGrade,
      isActive: false,
      sessionStatus: 'Graded',
      sessionStatusCode: 'graded',
      weekProgress,
    };
  }

  if (isActive) {
    return {
      finalGrade,
      isActive: true,
      sessionStatus: 'Ongoing',
      sessionStatusCode: 'active',
      weekProgress,
    };
  }

  return {
    finalGrade,
    isActive: false,
    sessionStatus: 'Completed but awaiting grading',
    sessionStatusCode: 'completed_awaiting_grading',
    weekProgress,
  };
}

async function syncSessionLifecycle(session, now = new Date()) {
  const lifecycle = getSessionLifecycle(session, now);
  let changed = false;

  if (session.finalGrade !== lifecycle.finalGrade) {
    session.finalGrade = lifecycle.finalGrade;
    changed = true;
  }

  if (session.isActive !== lifecycle.isActive) {
    session.isActive = lifecycle.isActive;
    changed = true;
  }

  if (changed) {
    await session.save();
  }

  return lifecycle;
}

function serializeSessionWithLifecycle(session, extras = {}, now = new Date()) {
  const lifecycle = getSessionLifecycle(session, now);
  const base = typeof session.toObject === 'function' ? session.toObject() : { ...session };

  return {
    ...base,
    ...extras,
    finalGrade: lifecycle.finalGrade,
    isActive: lifecycle.isActive,
    sessionStatus: lifecycle.sessionStatus,
    sessionStatusCode: lifecycle.sessionStatusCode,
    weekProgress: lifecycle.weekProgress,
  };
}

module.exports = {
  calculateWeekProgress,
  getSessionLifecycle,
  normalizeFinalGradeValue,
  serializeSessionWithLifecycle,
  syncSessionLifecycle,
};
