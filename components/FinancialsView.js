'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingDown, CreditCard, Plus, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { can } from '@/lib/permissions';

export default function FinancialsView({ projects, onRefresh, authUser }) {
  const canWrite = can(authUser, 'financials.write');
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    projectId: '',
    amount: '',
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    status: 'received',
    notes: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    projectId: '',
    category: 'Hosting & Server',
    amount: '',
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, expRes] = await Promise.all([
        fetch('/api/payments'),
        fetch('/api/expenses')
      ]);
      const payData = payRes.ok ? await payRes.json() : [];
      const expData = expRes.ok ? await expRes.json() : [];
      setPayments(Array.isArray(payData) ? payData : []);
      setExpenses(Array.isArray(expData) ? expData : []);
    } catch (err) {
      console.error('Failed to load financial records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.projectId || !paymentForm.amount) return;

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm)
      });
      if (res.ok) {
        setShowPaymentModal(false);
        setPaymentForm({
          projectId: '',
          amount: '',
          currency: 'USD',
          date: new Date().toISOString().split('T')[0],
          status: 'received',
          notes: ''
        });
        fetchData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to record payment:', err);
    }
  };

  const handleLogExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.category) return;

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm)
      });
      if (res.ok) {
        setShowExpenseModal(false);
        setExpenseForm({
          projectId: '',
          category: 'Hosting & Server',
          amount: '',
          currency: 'USD',
          date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        fetchData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to log expense:', err);
    }
  };

  const primaryCurrency = projects[0]?.currency || 'USD';
  const totalAgreed = projects.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const totalReceived = payments
    .filter(p => p.status === 'received')
    .reduce((sum, p) => sum + ((p.amount_minor || p.amountMinor || 0) / 100), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + ((e.amount_minor || e.amountMinor || 0) / 100), 0);
  const outstanding = Math.max(totalAgreed - totalReceived, 0);
  const netProfit = totalReceived - totalExpense;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financials</h2>
          <p className="text-muted-foreground mt-1">
            Track payments, manage expenses, and monitor agency profitability.
          </p>
        </div>
        {canWrite && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-secondary text-sm font-medium transition-colors"
          >
            <TrendingDown size={16} className="text-red-500" /> Log Expense
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Record Payment
          </button>
        </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">Total Received</span>
            <DollarSign size={16} className="text-green-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight mt-2 text-green-500">
            {formatCurrency(totalReceived, primaryCurrency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Collected payments</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">Total Expenses</span>
            <TrendingDown size={16} className="text-red-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight mt-2 text-red-500">
            {formatCurrency(totalExpense, primaryCurrency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Logged operational expenses</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">Outstanding</span>
            <CreditCard size={16} className="text-yellow-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight mt-2 text-yellow-500">
            {formatCurrency(outstanding, primaryCurrency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Pending client payments</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">Net Profit</span>
            {netProfit >= 0 ? <ArrowUpRight size={16} className="text-green-500" /> : <ArrowDownRight size={16} className="text-red-500" />}
          </div>
          <div className={`text-2xl font-bold font-mono tracking-tight mt-2 ${netProfit >= 0 ? 'text-foreground' : 'text-red-500'}`}>
            {formatCurrency(netProfit, primaryCurrency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Revenue minus expenses</p>
        </div>
      </div>

      {/* Tables Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payments Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <h3 className="font-semibold text-sm">Payment History</h3>
            <span className="text-xs text-muted-foreground">{payments.length} records</span>
          </div>
          <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
            <table className="w-full text-sm text-left min-w-[500px]">
              <thead className="border-b border-border bg-muted/10 text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <th className="p-3">Project</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-xs text-muted-foreground">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const proj = projects.find(pr => pr.id === (p.project_id || p.projectId));
                    const amt = (p.amount_minor || p.amountMinor || 0) / 100;
                    return (
                      <tr key={p.id} className="hover:bg-muted/20 text-xs">
                        <td className="p-3 font-medium">{proj?.projectName || 'Project Payment'}</td>
                        <td className="p-3 font-mono font-medium">{formatCurrency(amt, p.currency || 'USD')}</td>
                        <td className="p-3 text-muted-foreground">{p.paid_at || p.paidAt || 'N/A'}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            p.status === 'received' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'
                          }`}>
                            {p.status === 'received' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <h3 className="font-semibold text-sm">Expenses Log</h3>
            <span className="text-xs text-muted-foreground">{expenses.length} records</span>
          </div>
          <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
            <table className="w-full text-sm text-left min-w-[500px]">
              <thead className="border-b border-border bg-muted/10 text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-xs text-muted-foreground">
                      No expenses logged yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => {
                    const proj = projects.find(pr => pr.id === (e.project_id || e.projectId));
                    const amt = (e.amount_minor || e.amountMinor || 0) / 100;
                    return (
                      <tr key={e.id} className="hover:bg-muted/20 text-xs">
                        <td className="p-3 font-medium">{e.category}</td>
                        <td className="p-3 text-muted-foreground">{proj?.projectName || 'General Expense'}</td>
                        <td className="p-3 font-mono font-medium text-red-500">{formatCurrency(amt, e.currency || 'USD')}</td>
                        <td className="p-3 text-muted-foreground">{e.spent_at || e.spentAt || 'N/A'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold">Record Project Payment</h3>
            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div className="space-y-1 text-xs font-medium">
                <label>Select Project</label>
                <select
                  required
                  className="w-full rounded-md border border-input bg-background p-2 text-xs focus:ring-2 focus:ring-ring"
                  value={paymentForm.projectId}
                  onChange={e => {
                    const selectedPr = projects.find(p => p.id === e.target.value);
                    setPaymentForm({
                      ...paymentForm,
                      projectId: e.target.value,
                      currency: selectedPr?.currency || paymentForm.currency
                    });
                  }}
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.projectName} ({formatCurrency(p.amount, p.currency)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 text-xs font-medium">
                  <label>Currency</label>
                  <select
                    className="w-full rounded-md border border-input bg-background p-2 text-xs"
                    value={paymentForm.currency}
                    onChange={e => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1 text-xs font-medium">
                  <label>Amount</label>
                  <input
                    required type="number" step="0.01" placeholder="0.00"
                    className="w-full rounded-md border border-input bg-transparent p-2 text-xs"
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1 text-xs font-medium">
                  <label>Date</label>
                  <input
                    type="date" required
                    className="w-full rounded-md border border-input bg-transparent p-2 text-xs"
                    value={paymentForm.date}
                    onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1 text-xs font-medium">
                  <label>Status</label>
                  <select
                    className="w-full rounded-md border border-input bg-background p-2 text-xs"
                    value={paymentForm.status}
                    onChange={e => setPaymentForm({ ...paymentForm, status: e.target.value })}
                  >
                    <option value="received">Received</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 text-xs font-medium">
                <label>Notes (optional)</label>
                <input
                  type="text" placeholder="e.g. Milestone 1 payment via PayPal"
                  className="w-full rounded-md border border-input bg-transparent p-2 text-xs"
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button" onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-1.5 rounded-md border border-input text-xs font-medium hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md bg-white text-black hover:bg-white/90 text-xs font-medium"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold">Log Agency Expense</h3>
            <form onSubmit={handleLogExpense} className="space-y-3">
              <div className="space-y-1 text-xs font-medium">
                <label>Category</label>
                <select
                  required
                  className="w-full rounded-md border border-input bg-background p-2 text-xs"
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                >
                  <option value="Hosting & Server">Hosting & Server</option>
                  <option value="Software & Licenses">Software & Licenses</option>
                  <option value="Freelancer / Subcontractor">Freelancer / Subcontractor</option>
                  <option value="Domain Registration">Domain Registration</option>
                  <option value="Marketing & Ads">Marketing & Ads</option>
                  <option value="Office & Supplies">Office & Supplies</option>
                  <option value="Other Expense">Other Expense</option>
                </select>
              </div>

              <div className="space-y-1 text-xs font-medium">
                <label>Associated Project (optional)</label>
                <select
                  className="w-full rounded-md border border-input bg-background p-2 text-xs"
                  value={expenseForm.projectId}
                  onChange={e => setExpenseForm({ ...expenseForm, projectId: e.target.value })}
                >
                  <option value="">-- General Agency Expense --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.projectName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 text-xs font-medium">
                  <label>Currency</label>
                  <select
                    className="w-full rounded-md border border-input bg-background p-2 text-xs"
                    value={expenseForm.currency}
                    onChange={e => setExpenseForm({ ...expenseForm, currency: e.target.value })}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1 text-xs font-medium">
                  <label>Amount</label>
                  <input
                    required type="number" step="0.01" placeholder="0.00"
                    className="w-full rounded-md border border-input bg-transparent p-2 text-xs"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs font-medium">
                <label>Date</label>
                <input
                  type="date" required
                  className="w-full rounded-md border border-input bg-transparent p-2 text-xs"
                  value={expenseForm.date}
                  onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                />
              </div>

              <div className="space-y-1 text-xs font-medium">
                <label>Notes (optional)</label>
                <input
                  type="text" placeholder="e.g. AWS monthly server billing"
                  className="w-full rounded-md border border-input bg-transparent p-2 text-xs"
                  value={expenseForm.notes}
                  onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button" onClick={() => setShowExpenseModal(false)}
                  className="px-3 py-1.5 rounded-md border border-input text-xs font-medium hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md bg-white text-black hover:bg-white/90 text-xs font-medium"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
