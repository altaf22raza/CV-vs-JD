import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportResumeToPdf(elementId: string, fileName: string = 'Resume_Optimized.pdf'): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    return false;
  }

  try {
    // A4 dimensions in mm: 210 x 297
    const canvas = await html2canvas(element, {
      scale: 2.5, // High resolution for crisp text
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = 210;
    const pdfHeight = 297;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    if (imgHeight <= pdfHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
    } else {
      // If multi-page
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
    }

    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error('Failed to export PDF:', error);
    // Fallback to native window.print()
    window.print();
    return false;
  }
}

export function downloadTextFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
