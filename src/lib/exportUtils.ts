/**
 * PledgeVault — Export Utilities
 * Professional-grade CSV exports with Excel compatibility (UTF-8 BOM).
 */

import { formatDate } from './constants';

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;

  // 1. Extract Headers from the first object
  const headers = Object.keys(data[0]);
  
  // 2. Map data to rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      const val = row[header];
      // Escape commas and quotes for CSV safety
      const escaped = ('' + (val ?? '')).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',');
  });

  // 3. Combine headers and rows
  const csvContent = [headers.join(','), ...csvRows].join('\n');

  // 4. Add UTF-8 BOM (Byte Order Mark) so Excel recognizes it as UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 5. Trigger download
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Generates a standardized naming convention for exports.
 * Format: PV_[FirmName]_[ReportType]_[YYYYMMDD].csv
 */
export const getExportFilename = (firmName: string, reportType: string) => {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const cleanFirm = firmName.replace(/\s+/g, '_').toUpperCase();
  return `PV_${cleanFirm}_${reportType.toUpperCase()}_${date}.csv`;
};
