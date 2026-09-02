import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabase';

// Log export to audit log securely
const logExport = async (reportType: string, filters: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.rpc('log_audit_event', {
      p_action: 'export_report',
      p_entity_id: user.id,
      p_entity_type: 'report',
      p_metadata: { reportType, filters }
    });
  } catch (err) {
    console.error('Audit log failed', err);
  }
};

export const exportToCSV = async (data: any[], filename: string, reportType: string, filters: any = {}) => {
  if (!data || !data.length) return;
  await logExport(reportType, filters);
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => 
      typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
    ).join(',')
  );
  
  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = async (data: any[], filename: string, reportType: string, filters: any = {}) => {
  if (!data || !data.length) return;
  await logExport(reportType, filters);

  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Report');
  
  writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = async (data: any[], filename: string, reportType: string, filters: any = {}) => {
  if (!data || !data.length) return;
  await logExport(reportType, filters);

  const doc = new jsPDF('landscape');
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => Object.values(row));
  
  autoTable(doc, {
    head: [headers],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] } // Primary green color
  });
  
  doc.save(`${filename}.pdf`);
};
