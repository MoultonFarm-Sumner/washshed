import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { ReportItem } from "@/types";

/**
 * Generate a PDF report from farm inventory data with safety inspection compliance
 * @param title Title of the report
 * @param dateRange Date range string
 * @param reportData Array of report items
 * @param reportType Type of report (optional)
 * @param includeExtendedFields Whether to include all extended fields (optional)
 */
export async function generatePDF(
  title: string,
  dateRange: string,
  reportData: ReportItem[],
  reportType?: string,
  includeExtendedFields?: boolean
) {
  console.log("Generating PDF report:", { title, dateRange, reportItems: reportData.length, reportType, includeExtendedFields });
  try {
    // Create a new PDF document
    const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add report metadata
  doc.setFontSize(12);
  doc.text(`Date Range: ${dateRange}`, 14, 30);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);
  doc.text(`Report ID: REP-${Date.now().toString().slice(-8)}`, 14, 42); // Add unique report ID for tracking
  
  // Add inventory changes table
  doc.setFontSize(14);
  doc.text("Inventory Changes", 14, 50);
  
  // Determine which columns to show based on report type and extended fields option
  let inventoryColumns = ['Field Location', 'Crop', 'Current Stock', 'Units', 'Wash Inventory (Stock)'];
  
  if (reportType === 'detailed' || includeExtendedFields) {
    inventoryColumns = [
      'Field Location', 
      'Crop', 
      'Starting', 
      'Added', 
      'Removed', 
      'Current Stock', 
      'Units', 
      'Wash Inventory (Stock)', 
      'Field Notes', 
      'Retail Notes'
    ];
  }
  
  // Build table data
  const buildInventoryTableData = (item: ReportItem) => {
    if (reportType === 'detailed' || includeExtendedFields) {
      return [
        item.fieldLocation,
        item.name,
        item.starting,
        item.added > 0 ? `+${item.added}` : '0',
        item.removed > 0 ? `-${item.removed}` : '0',
        item.current,
        item.unit,
        item.washInventory || '-',
        item.fieldNotes || '-',
        item.retailNotes || '-'
      ];
    }
    
    return [
      item.fieldLocation,
      item.name,
      item.current,
      item.unit,
      item.washInventory || '-',
      item.fieldNotes || '-',
      item.retailNotes || '-'
    ];
  };
  
  // Create column styles based on the selected columns
  const createColumnStyles = (numColumns: number) => {
    const styles: Record<number, any> = {};
    for (let i = 4; i < numColumns; i++) {
      styles[i] = { cellWidth: 'auto' };
    }
    return styles;
  };
  
  // Use the autotable plugin to create inventory table
  (doc as any).autoTable({
    startY: 54,
    head: [reportType === 'detailed' || includeExtendedFields 
      ? inventoryColumns 
      : ['Field Location', 'Crop', 'Current Stock', 'Units', 'Wash Inventory (Stock)', 'Field Notes', 'Retail Notes']
    ],
    body: reportData.map(buildInventoryTableData),
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
      0: { cellWidth: 'auto' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 'auto', fillColor: [220, 240, 255] }, // Highlight wash inventory column
      5: { cellWidth: 'auto' },
      6: { cellWidth: 'auto' }
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 4,
      fontSize: 9 // Slightly smaller font to fit more data
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
      head: [['Field Location', 'Crop', 'Current Stock', 'Units', 'Status', 'Wash Inventory (Stock)', 'Field Notes', 'Retail Notes']],
      body: lowStockItems.map(item => [
        item.fieldLocation,
        item.name,
        item.current,
        item.unit,
        item.isCriticalStock ? 'Critical Stock' : 'Low Stock',
        item.washInventory || '-',
        item.fieldNotes || '-',
        item.retailNotes || '-'
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
        4: {
          fontStyle: 'bold',
          textColor: (data: any) => {
            if (data.cell.raw === 'Critical Stock') {
              return [229, 57, 53]; // Red
            }
            return [255, 160, 0]; // Yellow
          }
        },
        5: { cellWidth: 'auto', fillColor: [220, 240, 255] }, // Highlight wash inventory column
        6: { cellWidth: 'auto' },
        7: { cellWidth: 'auto' }
      },
      styles: {
        overflow: 'linebreak',
        cellPadding: 4,
        fontSize: 9 // Slightly smaller font to fit more data
      }
    });
  }
  
  // Add extended fields for safety inspections if available
  if (includeExtendedFields) {
    const extendedFieldsY = (doc as any).lastAutoTable?.finalY + 15 || (lowStockItems.length > 0 ? (doc as any).lastAutoTable.finalY + 15 : 200);
    
    // Only show extended fields section if we have data for it
    const hasExtendedData = reportData.some(item => 
      item.cropNeeds || item.standInventory || item.harvestBins || item.unitsHarvested
    );
    
    if (hasExtendedData) {
      doc.setFontSize(14);
      doc.text("Extended Fields for Safety Inspections", 14, extendedFieldsY);
      
      (doc as any).autoTable({
        startY: extendedFieldsY + 4,
        head: [['Field Location', 'Crop', 'Crop Needs', 'Stand Inventory', 'Harvest Bins', 'Units Harvested']],
        body: reportData.map(item => [
          item.fieldLocation,
          item.name,
          item.cropNeeds || '-',
          item.standInventory || '-',
          item.harvestBins || '-',
          item.unitsHarvested || '-'
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: [63, 81, 181], // Indigo for the extended fields section
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        columnStyles: {
          2: { cellWidth: 'auto' },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 'auto' },
          5: { cellWidth: 'auto' }
        },
        styles: {
          overflow: 'linebreak',
          cellPadding: 4,
          fontSize: 9 // Slightly smaller font to fit more data
        }
      });
    }
  }
  
  // Add legal compliance statement for safety inspections
  const legalNoteY = (doc as any).lastAutoTable?.finalY + 10 || 
                    (lowStockItems.length > 0 ? (doc as any).lastAutoTable.finalY + 10 : 240);
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    "Safety Inspection Notice: This report preserves original field locations and data for regulatory compliance.",
    14, 
    legalNoteY
  );
  doc.text(
    "All inventory changes are tracked with their original field designations regardless of subsequent modifications.",
    14, 
    legalNoteY + 5
  );
  
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
  
  // Save the PDF with timestamp for traceability
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  doc.save(`${title.replace(/\s+/g, '_')}_${timestamp}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
