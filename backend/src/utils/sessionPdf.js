const PDFDocument = require('pdfkit');

const { getSessionLifecycle } = require('./sessionLifecycle');

function sanitizeFilePart(value) {
  return String(value || 'session')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'session';
}

function formatDate(value, options = {}) {
  if (!value) return 'Not available';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return 'Not available';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getLogDate(log) {
  return new Date(log.date || log.createdAt);
}

function getWeekGroup(log) {
  const date = getLogDate(log);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  weekStart.setUTCDate(weekStart.getUTCDate() + diff);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  return {
    key: weekStart.toISOString().slice(0, 10),
    label: `${new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(weekStart)} - ${formatDate(weekEnd)}`,
  };
}

function groupLogsByWeek(logs) {
  const sortedLogs = [...logs].sort((left, right) => getLogDate(left) - getLogDate(right));
  const groups = new Map();

  sortedLogs.forEach((log) => {
    const week = getWeekGroup(log);

    if (!groups.has(week.key)) {
      groups.set(week.key, { key: week.key, label: week.label, logs: [] });
    }

    groups.get(week.key).logs.push(log);
  });

  return Array.from(groups.values());
}

function getContentWidth(doc) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function ensureSpace(doc, height) {
  const bottom = doc.page.height - doc.page.margins.bottom;

  if (doc.y + height > bottom) {
    doc.addPage();
  }
}

function drawSectionTitle(doc, title, subtitle) {
  ensureSpace(doc, subtitle ? 44 : 24);

  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('black')
    .text(title);

  if (subtitle) {
    doc
      .moveDown(0.2)
      .font('Helvetica')
      .fontSize(10)
      .fillColor('black')
      .text(subtitle);
  }

  doc.moveDown(0.6);
}

function drawField(doc, label, value) {
  const width = getContentWidth(doc);
  const safeValue = value || 'Not available';

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('black')
    .text(label, { width });

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('black')
    .text(safeValue, { width, lineGap: 2 });

  doc.moveDown(0.45);
}

function drawFieldList(doc, items) {
  items.forEach(({ label, value }) => {
    drawField(doc, label, value);
  });
}

function drawWeekHeader(doc, weekNumber, group) {
  ensureSpace(doc, 54);

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('black')
    .text(`Week ${weekNumber}`);

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('black')
    .text(`Date Range: ${group.label}`)
    .text(`Entries Recorded: ${group.logs.length}`);

  doc.moveDown(0.5);
}

function estimateFieldHeight(doc, label, value) {
  const width = getContentWidth(doc);
  const safeValue = value || 'Not available';
  const labelHeight = doc.heightOfString(label, { width });
  const valueHeight = doc.heightOfString(safeValue, { width, lineGap: 2 });
  return labelHeight + valueHeight + 12;
}

function estimateLogEntryHeight(doc, log) {
  const width = getContentWidth(doc);
  const statusText = log.supervisorStatus || 'Pending';
  const geofenceText = log.isWithinBoundary ? 'Inside geofence' : 'Outside geofence';
  const coordinates = Array.isArray(log.submissionLocation?.coordinates)
    ? `${Number(log.submissionLocation.coordinates[1]).toFixed(5)}, ${Number(log.submissionLocation.coordinates[0]).toFixed(5)}`
    : 'Not captured';

  const lines = [
    'Entry',
    `Date: ${formatDateTime(log.date || log.createdAt)}`,
    `Status: ${statusText}`,
    `Geofence: ${geofenceText}`,
    `Distance from company: ${Math.round(log.distanceFromCompanyMeters || 0)} m`,
    `Coordinates: ${coordinates}`,
  ];

  let totalHeight = lines.reduce((sum, line) => sum + doc.heightOfString(line, { width }), 0);
  totalHeight += estimateFieldHeight(doc, 'Tasks Done', log.tasksDone || 'Not provided');
  totalHeight += estimateFieldHeight(doc, 'Skills Learned', log.skillsLearned || 'Not provided');

  if (log.supervisorComment) {
    totalHeight += estimateFieldHeight(doc, 'Supervisor Comment', log.supervisorComment);
  }

  return totalHeight + 24;
}

function drawLogEntry(doc, log, index) {
  ensureSpace(doc, estimateLogEntryHeight(doc, log));

  const statusText = log.supervisorStatus || 'Pending';
  const geofenceText = log.isWithinBoundary ? 'Inside geofence' : 'Outside geofence';
  const coordinates = Array.isArray(log.submissionLocation?.coordinates)
    ? `${Number(log.submissionLocation.coordinates[1]).toFixed(5)}, ${Number(log.submissionLocation.coordinates[0]).toFixed(5)}`
    : 'Not captured';

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('black')
    .text(`Entry ${index + 1}`);

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('black')
    .text(`Date: ${formatDateTime(log.date || log.createdAt)}`)
    .text(`Status: ${statusText}`)
    .text(`Geofence: ${geofenceText}`)
    .text(`Distance from company: ${Math.round(log.distanceFromCompanyMeters || 0)} m`)
    .text(`Coordinates: ${coordinates}`);

  doc.moveDown(0.2);

  drawField(doc, 'Tasks Done', log.tasksDone || 'Not provided');
  drawField(doc, 'Skills Learned', log.skillsLearned || 'Not provided');

  if (log.supervisorComment) {
    drawField(doc, 'Supervisor Comment', log.supervisorComment);
  }

  doc.moveDown(0.5);
}

function streamSessionPdf(res, {
  session,
  logs,
  exportedByRole,
  exportedByName,
}) {
  const lifecycle = getSessionLifecycle(session);
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const studentName = session.student?.name || 'Student';
  const title = `${studentName} Log Report`;
  const filename = `${sanitizeFilePart(studentName)}-log-report.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);

  const approvedLogs = logs.filter((log) => log.supervisorStatus === 'Approved').length;
  const rejectedLogs = logs.filter((log) => log.supervisorStatus === 'Rejected').length;
  const pendingLogs = logs.length - approvedLogs - rejectedLogs;

  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .fillColor('black')
    .text(title);

  doc
    .moveDown(0.4)
    .font('Helvetica')
    .fontSize(10)
    .fillColor('black')
    .text(`Generated: ${formatDateTime(new Date())}`)
    .text(`Exported by: ${exportedByRole} - ${exportedByName || 'KaziLog user'}`);

  doc.moveDown(1);

  drawSectionTitle(doc, 'Student and Session Overview');
  drawFieldList(doc, [
    { label: 'Student Name', value: session.student?.name || 'Not available' },
    { label: 'Registration Number', value: session.student?.registrationNumber || 'Not available' },
    { label: 'Student Email', value: session.student?.email || 'Not available' },
    { label: 'Company', value: session.company?.name || 'Not available' },
    { label: 'Supervisor', value: session.supervisor?.name || 'Not assigned' },
    { label: 'Assessor', value: session.assessor?.name || 'Not assigned' },
    { label: 'Session Dates', value: `${formatDate(session.startDate)} to ${formatDate(session.endDate)}` },
    { label: 'Session Status', value: `${lifecycle.sessionStatus} (${lifecycle.weekProgress.label})` },
    { label: 'Final Grade', value: lifecycle.finalGrade },
  ]);

  drawSectionTitle(doc, 'Submission Summary');
  drawFieldList(doc, [
    { label: 'Total Logs', value: String(logs.length) },
    { label: 'Approved', value: String(approvedLogs) },
    { label: 'Rejected', value: String(rejectedLogs) },
    { label: 'Pending', value: String(pendingLogs) },
  ]);

  const groupedLogs = groupLogsByWeek(logs);

  if (!groupedLogs.length) {
    drawSectionTitle(doc, 'Weekly Log Entries');
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('black')
      .text('No submitted logs were found for this attachment session.');
    doc.end();
    return;
  }

  drawSectionTitle(
    doc,
    'Weekly Log Entries',
    `${groupedLogs.length} ${groupedLogs.length === 1 ? 'week' : 'weeks'} with submitted logs.`,
  );

  groupedLogs.forEach((group, groupIndex) => {
    drawWeekHeader(doc, groupIndex + 1, group);

    group.logs.forEach((log, logIndex) => {
      drawLogEntry(doc, log, logIndex);
    });
  });

  doc.end();
}

module.exports = {
  streamSessionPdf,
};
