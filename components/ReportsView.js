'use client';

import { useState, useEffect } from 'react';
import { Download, Calendar, DollarSign, TrendingDown, PieChart, Users, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export default function ReportsView({ projects }) {
  const currentYearStart = `${new Date().getFullYear()}-01-01`;
  const today = new Date().toISOString().split('T')[0];

  const [from, setFrom] = useState(currentYearStart);
  const [to, setTo] = useState(today);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeReportType, setActiveReportType] = useState('revenue');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?from=${from}&to=${to}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error('Failed to fetch report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [from, to]);

  const handleExportCSV = () => {
    window.open(`/api/reports?from=${from}&to=${to}&format=csv`, '_blank');
  };

  const primaryCurrency = projects[0]?.currency || 'USD';

  // Calculate totals from reportData
  const revenueList = reportData?.revenue || [];
  const expenseList = reportData?.expenses || [];

  const totalRevenueAgreed = revenueList.reduce((sum, r) => sum + (r.agreedAmountMinor / 100), 0);
  const totalRevenuePaid = revenueList.reduce((sum, r) => sum + (r.paidAmountMinor / 100), 0);
  const totalExpenses = expenseList.reduce((sum, e) => sum + (e.amountMinor / 100), 0);
  const netProfit = totalRevenuePaid - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agency Reports</h2>
          <p className="text-muted-foreground mt-1">
            Analyze agency performance, track profitability, and export CSV reports.
          </p>
        </div>

        {/* Date Filter & Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border p-1.5 rounded-lg text-xs">
            <Calendar size={14} className="text-muted-foreground ml-1" />
            <input
              type="date"
              className="bg-transparent text-xs focus:outline-none"
              value={from}
              onChange={e => setFrom(e.target.value)}
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="date"
              className="bg-transparent text-xs focus:outline-none"
              value={to}
              onChange={e => setTo(e.target.value)}
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm font-medium transition-colors shadow-sm"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Report Type Selector Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveReportType('revenue')}
          className={`p-5 rounded-xl border text-left transition-all ${
            activeReportType === 'revenue' ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-card hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Revenue Report</span>
            <DollarSign size={16} className="text-green-500" />
          </div>
          <p className="text-xl font-bold font-mono mt-2">{formatCurrency(totalRevenuePaid, primaryCurrency)}</p>
          <span className="text-xs text-muted-foreground mt-1 block">Total collected in period</span>
        </button>

        <button
          onClick={() => setActiveReportType('expense')}
          className={`p-5 rounded-xl border text-left transition-all ${
            activeReportType === 'expense' ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-card hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Expense Report</span>
            <TrendingDown size={16} className="text-red-500" />
          </div>
          <p className="text-xl font-bold font-mono mt-2">{formatCurrency(totalExpenses, primaryCurrency)}</p>
          <span className="text-xs text-muted-foreground mt-1 block">Total spent in period</span>
        </button>

        <button
          onClick={() => setActiveReportType('profit')}
          className={`p-5 rounded-xl border text-left transition-all ${
            activeReportType === 'profit' ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-card hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Profit Report</span>
            <PieChart size={16} className="text-blue-500" />
          </div>
          <p className="text-xl font-bold font-mono mt-2">{formatCurrency(netProfit, primaryCurrency)}</p>
          <span className="text-xs text-muted-foreground mt-1 block">Collected minus expenses</span>
        </button>

        <button
          onClick={() => setActiveReportType('client')}
          className={`p-5 rounded-xl border text-left transition-all ${
            activeReportType === 'client' ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-card hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Client Breakdown</span>
            <Users size={16} className="text-purple-500" />
          </div>
          <p className="text-xl font-bold font-mono mt-2">{revenueList.length} Projects</p>
          <span className="text-xs text-muted-foreground mt-1 block">Active project contracts</span>
        </button>
      </div>

      {/* Selected Report Data View */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
          <h3 className="font-semibold text-sm capitalize flex items-center gap-2">
            <FileText size={16} />
            {activeReportType} Report Breakdown ({from} to {to})
          </h3>
          <span className="text-xs text-muted-foreground">
            {activeReportType === 'expense' ? `${expenseList.length} items` : `${revenueList.length} items`}
          </span>
        </div>

        <div className="overflow-x-auto">
          {activeReportType === 'expense' ? (
            <table className="w-full text-sm text-left">
              <thead className="border-b border-border bg-muted/10 text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Spent Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenseList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-xs text-muted-foreground">
                      No expenses logged in this date range.
                    </td>
                  </tr>
                ) : (
                  expenseList.map((exp) => (
                    <tr key={exp.id} className="hover:bg-muted/20 text-xs">
                      <td className="p-3 font-medium">{exp.category}</td>
                      <td className="p-3 text-muted-foreground">{exp.projectName || 'General Expense'}</td>
                      <td className="p-3 font-mono font-medium text-red-500">{formatCurrency(exp.amountMinor / 100, exp.currency || 'USD')}</td>
                      <td className="p-3 text-muted-foreground">{exp.spentAt || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="border-b border-border bg-muted/10 text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <th className="p-3">Project</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Agreed Amount</th>
                  <th className="p-3">Received Amount</th>
                  <th className="p-3">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {revenueList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-xs text-muted-foreground">
                      No project revenue recorded in this date range.
                    </td>
                  </tr>
                ) : (
                  revenueList.map((rev) => {
                    const agreed = rev.agreedAmountMinor / 100;
                    const paid = rev.paidAmountMinor / 100;
                    const rem = Math.max(agreed - paid, 0);
                    return (
                      <tr key={rev.id} className="hover:bg-muted/20 text-xs">
                        <td className="p-3 font-medium">{rev.projectName}</td>
                        <td className="p-3 text-muted-foreground">{rev.client || 'Direct'}</td>
                        <td className="p-3 font-mono">{formatCurrency(agreed, rev.currency || 'USD')}</td>
                        <td className="p-3 font-mono text-green-500 font-medium">{formatCurrency(paid, rev.currency || 'USD')}</td>
                        <td className="p-3 font-mono text-yellow-500">{formatCurrency(rem, rev.currency || 'USD')}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
