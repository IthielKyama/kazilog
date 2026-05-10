const PDFDocument = require('pdfkit');
const { getSessionLifecycle } = require('./sessionLifecycle');

function sanitizeFilePart(value) {
  return String(value || 'session')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'session';
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
    label: `${formatDate(weekStart, { year: undefined })} - ${formatDate(weekEnd)}`,
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

function ensureSpace(doc, height) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + height > bottom) {
    doc.addPage();
  }
}

function drawDivider(doc, y) {
  doc.moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .lineWidth(0.5)
    .strokeColor('#999999')
    .stroke();
}

function drawSectionHeader(doc, title, subtitle) {
  ensureSpace(doc, 40);
  doc.moveDown(1.5);
  doc.x = doc.page.margins.left;
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000').text(title);
  
  if (subtitle) {
    doc.x = doc.page.margins.left;
    doc.font('Helvetica').fontSize(10).fillColor('#333333').text(subtitle);
  }
  
  doc.moveDown(0.3);
  drawDivider(doc, doc.y);
  doc.moveDown(0.5);
}

function streamSessionPdf(res, { session, logs, exportedByRole, exportedByName }) {
  const lifecycle = getSessionLifecycle(session);
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    bufferPages: true,
    info: {
      Title: `${session.student?.name || 'Student'} Log Report`,
      Author: 'KaziLog System',
    }
  });

  const studentName = session.student?.name || 'Student';
  const filename = `${sanitizeFilePart(studentName)}-log-report.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);

  // --- Header ---
  doc.font('Helvetica-Bold').fontSize(20).fillColor('#000000').text('Attachment Log Report', { align: 'center' });
  doc.moveDown(0.5);
  
  doc.font('Helvetica').fontSize(10).fillColor('#333333');
  doc.text(`Generated: ${formatDateTime(new Date())}`, { align: 'center' });
  doc.text(`Exported by: ${exportedByName || 'KaziLog user'} (${exportedByRole})`, { align: 'center' });

  // --- Session Overview ---
  drawSectionHeader(doc, 'Session Overview');
  
  const overviewItems = [
    { label: 'Student Name', value: session.student?.name || 'Not available' },
    { label: 'Registration No.', value: session.student?.registrationNumber || 'Not available' },
    { label: 'Company', value: session.company?.name || 'Not available' },
    { label: 'Supervisor', value: session.supervisor?.name || 'Not assigned' },
    { label: 'Assessor', value: session.assessor?.name || 'Not assigned' },
    { label: 'Session Dates', value: `${formatDate(session.startDate)} to ${formatDate(session.endDate)}` },
    { label: 'Final Grade', value: lifecycle.finalGrade },
  ];
  
  const colWidth = (doc.page.width - 100) / 2;
  for (let i = 0; i < overviewItems.length; i += 2) {
    const currentY = doc.y;
    ensureSpace(doc, 15);
    
    // Left column
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text(`${overviewItems[i].label}: `, 50, currentY, { continued: true });
    doc.font('Helvetica').fillColor('#333333').text(overviewItems[i].value);
    
    // Right column
    if (i + 1 < overviewItems.length) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text(`${overviewItems[i + 1].label}: `, 50 + colWidth, currentY, { continued: true });
      doc.font('Helvetica').fillColor('#333333').text(overviewItems[i + 1].value);
    }
    
    doc.y = currentY + 18;
  }



  // --- Weekly Logs ---
  const groupedLogs = groupLogsByWeek(logs);

  if (!groupedLogs.length) {
    drawSectionHeader(doc, 'Weekly Log Entries');
    doc.font('Helvetica').fontSize(10).fillColor('#333333').text('No submitted logs were found for this attachment session.');
    doc.end();
    return;
  }

  drawSectionHeader(doc, 'Weekly Log Entries', `${groupedLogs.length} ${groupedLogs.length === 1 ? 'week' : 'weeks'} recorded`);

  groupedLogs.forEach((group, groupIndex) => {
    ensureSpace(doc, 30);
    
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#000000').text(`Week ${groupIndex + 1} (${group.label})`, doc.page.margins.left, doc.y);
    doc.moveDown(0.5);

    group.logs.forEach((log, logIndex) => {
      ensureSpace(doc, 40);
      
      const logHeaderY = doc.y;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text(`Entry ${logIndex + 1}: ${formatDate(log.date || log.createdAt)}`, 50, logHeaderY);
      
      const statusText = `Status: ${(log.supervisorStatus || 'Pending').toUpperCase()}`;
      doc.text(statusText, 50, logHeaderY, { align: 'right', width: doc.page.width - 100 });
      
      doc.y = logHeaderY + 15;
      doc.x = 50;
      
      doc.font('Helvetica-Bold').fontSize(9).text('Tasks Done:');
      doc.font('Helvetica').fontSize(10).text(log.tasksDone || 'Not provided');
      doc.moveDown(0.5);
      
      doc.font('Helvetica-Bold').fontSize(9).text('Skills Learned:');
      doc.font('Helvetica').fontSize(10).text(log.skillsLearned || 'Not provided');
      
      if (log.supervisorComment) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(9).text('Supervisor Comment:');
        doc.font('Helvetica').fontSize(10).text(log.supervisorComment);
      }
      
      doc.moveDown(1);
    });
  });

  // Footer on all pages
  const range = doc.bufferedPageRange ? doc.bufferedPageRange() : { count: 1 };
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.font('Helvetica').fontSize(8).fillColor('#999999');
    doc.text(`Page ${i + 1} of ${range.count} - KaziLog System`, 50, doc.page.height - 40, { align: 'center' });
  }

  doc.end();
}

module.exports = {
  streamSessionPdf,
};
