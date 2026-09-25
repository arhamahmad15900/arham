import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ResultRow {
  candidateName: string;
  rollNo: string;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  score: number;
  percentage: number;
  submissionTime: string;
  submissionType: string;
}

interface ExamReportData {
  testName: string;
  topic: string;
  examinerName: string;
  sessionId: string;
  date: string;
  results: ResultRow[];
}

export function generateExamReportPDF(data: ExamReportData) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [2, 82, 156]; // #02529c
  const darkTextColor = [30, 41, 59];

  // 1. Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ACCESS COMPUTER EDUCATION CENTER', 148.5, 10, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Computer-Based Examination Report & Candidate Performance Summary', 148.5, 17, { align: 'center' });

  // 2. Metadata Box
  doc.setFillColor(245, 247, 250);
  doc.rect(14, 28, 269, 20, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, 28, 269, 20, 'S');

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Examination: ${data.testName}`, 18, 35);
  doc.text(`Session ID: ${data.sessionId}`, 18, 42);

  doc.text(`Subject/Topic: ${data.topic}`, 115, 35);
  doc.text(`Date: ${data.date}`, 115, 42);

  doc.text(`Examiner: ${data.examinerName}`, 210, 35);
  doc.text(`Total Submitted Candidates: ${data.results.length}`, 210, 42);

  // 3. Candidate Results Table
  const tableData = data.results.map((r, index) => [
    index + 1,
    r.rollNo,
    r.candidateName,
    r.totalQuestions,
    r.attemptedQuestions,
    r.correctAnswers,
    r.incorrectAnswers,
    r.unansweredQuestions,
    `${r.score}`,
    `${r.percentage}%`,
    r.percentage >= 50 ? 'PASS' : 'FAIL',
    r.submissionTime
  ]);

  autoTable(doc, {
    startY: 52,
    head: [[
      '#',
      'Roll No',
      'Candidate Name',
      'Total Qs',
      'Attempted',
      'Correct',
      'Incorrect',
      'Unanswered',
      'Score',
      'Percentage',
      'Status',
      'Submitted At'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [2, 82, 156],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [33, 37, 41],
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 24, fontStyle: 'bold', halign: 'center' },
      2: { cellWidth: 46, halign: 'left' },
      3: { cellWidth: 18 },
      4: { cellWidth: 18 },
      5: { cellWidth: 18, textColor: [25, 135, 84], fontStyle: 'bold' },
      6: { cellWidth: 18, textColor: [220, 53, 69] },
      7: { cellWidth: 20 },
      8: { cellWidth: 18, fontStyle: 'bold' },
      9: { cellWidth: 22, fontStyle: 'bold' },
      10: { cellWidth: 18, fontStyle: 'bold' },
      11: { cellWidth: 39, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 10) {
        if (data.cell.raw === 'PASS') {
          data.cell.styles.textColor = [25, 135, 84];
        } else {
          data.cell.styles.textColor = [220, 53, 69];
        }
      }
    },
    margin: { left: 14, right: 14 }
  });

  // Footer with Page Numbers
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Access Computer Education Center • System Generated Report • Page ${i} of ${totalPages}`,
      148.5,
      202,
      { align: 'center' }
    );
  }

  // Trigger download
  doc.save(`ACE_Exam_Report_${data.sessionId}.pdf`);
}
