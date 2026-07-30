import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, FileText, Plus, CheckCircle, RefreshCw } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { useApp } from '../context/AppContext';
import api from '../services/api';

export default function Reports() {
  const { addToast, refreshTrigger } = useApp();
  const [reports, setReports] = useState([]);
  const [reportType, setReportType] = useState('Daily Budget Report');
  const [generating, setGenerating] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchReports();
  }, [refreshTrigger]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/reports/generate', { report_type: reportType });
      addToast('Report Generated', `Successfully generated ${reportType}`, 'success');
      fetchReports();
    } catch (err) {
      addToast('Error', 'Failed to generate report', 'critical');
    } finally {
      setGenerating(false);
    }
  };

  // Export to CSV
  const exportCSV = async (type) => {
    try {
      const res = await api.get('/usage?limit=500');
      const csvData = Papa.unparse(res.data);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `agent_budget_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('CSV Exported', 'Downloaded CSV report dataset.', 'success');
    } catch (err) {
      addToast('Error', 'Failed to export CSV', 'critical');
    }
  };

  // Export to PDF
  const exportPDF = async () => {
    try {
      const [sumRes, usageRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/usage?limit=50'),
      ]);

      const doc = new jsPDF();
      const kpis = sumRes.data.kpis;

      // Title Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('AGENT BUDGET CONTROLLER', 14, 20);
      doc.setFontSize(10);
      doc.text('AI Cost Governance Platform - Executive Report', 14, 28);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 28);

      // Executive Summary Metrics
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text('Executive Summary', 14, 50);

      const summaryRows = [
        ['Total Org Budget', `$${kpis.total_organization_budget}`],
        ['Used Budget', `$${kpis.used_budget}`],
        ['Remaining Budget', `$${kpis.remaining_budget}`],
        ['Today Spending', `$${kpis.today_spending}`],
        ['Active AI Agents', `${kpis.active_ai_agents}`],
        ['Blocked Requests', `${kpis.blocked_requests}`],
      ];

      doc.autoTable({
        startY: 55,
        head: [['Metric', 'Value']],
        body: summaryRows,
        theme: 'striped',
        headStyles: { fillStyle: '#2563EB', textColor: '#FFFFFF' },
      });

      // API Usage Table
      doc.setFontSize(12);
      doc.text('Recent API Request Telemetry', 14, doc.lastAutoTable.finalY + 15);

      const tableData = usageRes.data.slice(0, 20).map((u) => [
        u.agent_name,
        u.model,
        u.tokens.toString(),
        `$${u.cost.toFixed(4)}`,
        u.status,
      ]);

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Agent', 'Model', 'Tokens', 'Cost', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: '#1E293B', textColor: '#FFFFFF' },
      });

      doc.save(`Agent_Budget_Executive_Report_${Date.now()}.pdf`);
      addToast('PDF Exported', 'Generated and downloaded executive PDF report.', 'success');
    } catch (err) {
      addToast('Error', 'Failed to generate PDF export', 'critical');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-400" /> Executive Reporting & Export Center
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Generate, view, and export enterprise AI budget audits in PDF and CSV formats</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV('all')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-xs transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Export CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-glow-blue transition-all"
          >
            <FileText className="w-4 h-4" /> Export Executive PDF
          </button>
        </div>
      </div>

      {/* Report Generator Box */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-white tracking-wide uppercase">Generate Custom Governance Report</h3>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full sm:w-80 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="Daily Budget Report">Daily Budget Report</option>
            <option value="Monthly Budget Report">Monthly Budget Report</option>
            <option value="Agent Spending Report">Agent Spending Report</option>
            <option value="Team Spending Report">Team Spending Report</option>
            <option value="Organization Report">Organization Report</option>
            <option value="Token Usage Report">Token Usage Report</option>
          </select>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-semibold text-xs shadow-glow-blue transition-all flex items-center justify-center gap-2"
          >
            {generating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" /> Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Historical Generated Reports Grid */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-gray-200 tracking-wide uppercase">Generated Reports History</h3>
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.report_id} className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-200">{r.report_type}</h4>
                  <p className="text-[10px] text-gray-500 font-mono">Generated: {new Date(r.generated_date).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportPDF}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button
                  onClick={() => exportCSV(r.report_type)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
