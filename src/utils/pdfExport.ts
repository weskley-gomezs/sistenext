import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
const logoUrl = 'https://i.imgur.com/BewcRiJ.png';

interface ExportData {
  title: string;
  subtitle?: string;
  head: string[][];
  body: any[][];
  summary?: { label: string; value: string | number }[];
  customLogo?: string;
  companyName?: string;
}

export const exportToPDF = ({ title, subtitle, head, body, summary, customLogo, companyName }: ExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const finalCompanyName = companyName || 'NEXUS ERP';

  const addHeader = (reportTitle: string) => {
    // Background Accent
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Logo
    try {
      const imgToUse = customLogo || logoUrl;
      const format = imgToUse.includes('png') || imgToUse.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(imgToUse, format, 14, 8, 24, 24);
    } catch (e) {
      // Fallback if image fails
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(14, 8, 24, 24, 4, 4, 'F');
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.text(finalCompanyName.substring(0, 2).toUpperCase(), 20, 24);
    }

    // Title
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(finalCompanyName.toUpperCase(), 45, 22);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(reportTitle, 45, 30);

    // Metadata (Right aligned)
    doc.setFontSize(8);
    doc.text(`EMISSÃO: ${new Date().toLocaleString('pt-BR')}`, pageWidth - 14, 18, { align: 'right' });
    doc.text(`PÁGINA: ${doc.getNumberOfPages()}`, pageWidth - 14, 24, { align: 'right' });
  };

  const addFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`${finalCompanyName} - Sistema de Gestão Empresarial`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }
  };

  addHeader(title);

  let startY = 50;

  if (summary && summary.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(44, 62, 80);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO', 14, 55);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    summary.forEach((item, index) => {
      doc.text(`${item.label}: ${item.value}`, 14, 62 + (index * 5));
    });
    startY = 65 + (summary.length * 5);
  }

  autoTable(doc, {
    startY: startY,
    head: head,
    body: body,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { top: 45 },
  });

  addFooter();
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`);
};
