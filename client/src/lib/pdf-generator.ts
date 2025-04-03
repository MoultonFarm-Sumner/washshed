import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { ReportItem } from "@/types";

/**
 * Generate a PDF report from farm inventory data
 * @param title Title of the report
 * @param dateRange Date range string
 * @param reportData Array of report items
 */
export async function generatePDF(
  title: string,
  dateRange: string,
  reportData: ReportItem[]
) {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add date range
  doc.setFontSize(12);
  doc.text(`Date Range: ${dateRange}`, 14, 30);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);
  
  // Add inventory changes table
  doc.setFontSize(14);
  doc.text("Inventory Changes", 14, 46);
  
  // Use the autotable plugin to create inventory table
  (doc as any).autoTable({
    startY: 50,
    head: [
      [
        'Field Location', 
        'Crop', 
        'Starting Stock (Wash)', 
        'Added (Wash)', 
        'Removed (Wash)', 
        'Current Stock (Wash)',
        'Units', 
        'Field Notes', 
        'Retail Notes'
      ]
    ],
    body: reportData.map(item => [
      item.fieldLocation,
      item.name,
      item.starting,
      item.added,
      item.removed,
      item.current,
      item.unit,
      item.fieldNotes || '-',
      item.retailNotes || '-'
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [46, 125, 50],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    columnStyles: {
      0: { cellWidth: 'auto' },  // Field Location
      1: { cellWidth: 'auto' },  // Crop
      2: { cellWidth: 'auto' },  // Starting Stock
      3: { cellWidth: 'auto' },  // Added
      4: { cellWidth: 'auto' },  // Removed
      5: { cellWidth: 'auto' },  // Current Stock
      6: { cellWidth: 'auto' },  // Units
      7: { cellWidth: 'auto' },  // Field Notes
      8: { cellWidth: 'auto' },  // Retail Notes
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 4
    }
  });
  
  // Low stock table
  const lowStockItems = reportData.filter(item => item.isLowStock);
  
  if (lowStockItems.length > 0) {
    doc.setFontSize(14);
    const lowStockY = (doc as any).lastAutoTable.finalY + 15;
    doc.text("Low Stock Alert", 14, lowStockY);
    
    (doc as any).autoTable({
      startY: lowStockY + 4,
      head: [
        [
          'Field Location', 
          'Crop', 
          'Current Stock (Wash)', 
          'Units', 
          'Status', 
          'Starting Stock (Wash)', 
          'Added (Wash)', 
          'Removed (Wash)', 
          'Field Notes'
        ]
      ],
      body: lowStockItems.map(item => [
        item.fieldLocation,
        item.name,
        item.current,
        item.unit,
        item.isCriticalStock ? 'Critical Stock' : 'Low Stock',
        item.starting,
        item.added,
        item.removed,
        item.fieldNotes || '-'
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [255, 160, 0],
        textColor: 0,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      columnStyles: {
        0: { cellWidth: 'auto' },  // Field Location
        1: { cellWidth: 'auto' },  // Crop
        2: { cellWidth: 'auto' },  // Current Stock
        3: { cellWidth: 'auto' },  // Units
        4: {                       // Status
          fontStyle: 'bold',
          textColor: (data: any) => {
            if (data.cell.raw === 'Critical Stock') {
              return [229, 57, 53]; // Red for Critical
            }
            return [255, 160, 0];   // Yellow for Low
          }
        },
        5: { cellWidth: 'auto' },  // Starting
        6: { cellWidth: 'auto' },  // Added
        7: { cellWidth: 'auto' },  // Removed
        8: { cellWidth: 'auto' }   // Field Notes
      },
      styles: {
        overflow: 'linebreak',
        cellPadding: 4
      }
    });
  }
  
  // Add farm name in footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      "Farm Management System",
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - 20,
      doc.internal.pageSize.getHeight() - 10
    );
  }
  
  // Save the PDF
  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}
