import { DollarSign, Activity, CreditCard, ArrowUpRight } from 'lucide-react';
import { startOfMonth, subMonths, isSameMonth, subWeeks, isAfter } from 'date-fns';

export default function StatsCards({ projects }) {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));

    // Helper: Filter projects by month based on date property
    const getProjectsInMonth = (date) => projects.filter(p => {
        try {
            const pDate = new Date(p.date);
            return !isNaN(pDate.getTime()) && isSameMonth(pDate, date);
        } catch {
            return false;
        }
    });


    // 1. Revenue Calculations (INR)
    const currentMonthProjects = getProjectsInMonth(now);
    const lastMonthProjects = getProjectsInMonth(subMonths(now, 1));
    const totalRevenue = projects.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

    const currentMonthRevenue = currentMonthProjects.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
    const lastMonthRevenue = lastMonthProjects.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
    const revenueGrowth = lastMonthRevenue === 0 ? 100 : ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

    // 2. Active Projects (Change since last week)
    const activeProjects = projects.filter(p => p.status === 'In Progress').length;
    const newActiveLastWeek = projects.filter(p => {
        if (p.status !== 'In Progress') return false;
        try {
            const pDate = new Date(p.date);
            return !isNaN(pDate.getTime()) && isAfter(pDate, subWeeks(now, 1));
        } catch {
            return false;
        }
    }).length;


    // 3. Average Deal (All time vs Monthly Trend)
    const avgDeal = projects.length ? totalRevenue / projects.length : 0;
    const avgDealLastMonth = lastMonthProjects.length ? lastMonthRevenue / lastMonthProjects.length : 0;
    const avgDealGrowth = avgDealLastMonth === 0 ? 0 : ((avgDeal - avgDealLastMonth) / avgDealLastMonth) * 100;

    // 4. Win Rate (Completed vs Total Finished)
    const finishedProjects = projects.filter(p => ['Completed', 'Cancelled'].includes(p.status));
    const completedProjects = projects.filter(p => p.status === 'Completed');
    const winRate = finishedProjects.length ? (completedProjects.length / finishedProjects.length) * 100 : 0;

    // Win Rate Growth (Comparison to last month's win rate)
    const lastMonthFinished = lastMonthProjects.filter(p => ['Completed', 'Cancelled'].includes(p.status));
    const lastMonthCompleted = lastMonthProjects.filter(p => p.status === 'Completed');
    const lastMonthWinRate = lastMonthFinished.length ? (lastMonthCompleted.length / lastMonthFinished.length) * 100 : 0;
    const winRateGrowth = winRate - lastMonthWinRate;

    const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    const cards = [
        {
            label: "Total Revenue",
            value: formatINR(totalRevenue),
            change: `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% from last month`,
            icon: DollarSign,
            trend: revenueGrowth >= 0 ? 'up' : 'down'
        },
        {
            label: "Active Projects",
            value: activeProjects,
            change: `+${newActiveLastWeek} new this week`,
            icon: Activity,
            trend: 'neutral'
        },
        {
            label: "Average Deal",
            value: formatINR(avgDeal),
            change: `${avgDealGrowth > 0 ? '+' : ''}${avgDealGrowth.toFixed(1)}% vs last month`,
            icon: CreditCard,
            trend: avgDealGrowth >= 0 ? 'up' : 'down'
        },
        {
            label: "Win Rate",
            value: `${winRate.toFixed(1)}%`,
            change: `${winRateGrowth > 0 ? '+' : ''}${winRateGrowth.toFixed(1)}% from last month`,
            icon: ArrowUpRight,
            trend: winRateGrowth >= 0 ? 'up' : 'down'
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                            {card.label}
                        </span>
                        <card.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold tracking-tight mt-2">
                        {card.value}
                    </div>
                    <p className={`text-xs mt-1 ${card.trend === 'up' ? 'text-green-600' :
                        card.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
                        }`}>
                        {card.change}
                    </p>
                </div>
            ))}
        </div>
    );
}
