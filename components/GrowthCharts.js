'use client';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { format, eachMonthOfInterval, startOfYear, endOfMonth, isWithinInterval } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

export default function GrowthCharts({ projects, type }) {
    // 1. Calculate REAL Monthly Data
    const months = eachMonthOfInterval({ start: startOfYear(new Date()), end: new Date() });
    
    if (type === 'line') {
        const monthlyRevenue = months.map(month => {
            return projects
                .filter(p => {
                    const pDate = new Date(p.date);
                    return isWithinInterval(pDate, { start: month, end: endOfMonth(month) });
                })
                .reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
        });

        // Calculate YTD Growth
        const currentMonthRev = monthlyRevenue[monthlyRevenue.length - 1] || 0;
        const prevMonthRev = monthlyRevenue[monthlyRevenue.length - 2] || 0;
        const growth = prevMonthRev === 0 ? (currentMonthRev > 0 ? 100 : 0) : ((currentMonthRev - prevMonthRev) / prevMonthRev) * 100;

        return (
            <div className="h-[300px] w-full flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                    <div className="text-2xl font-bold tracking-tight">
                        {currentMonthRev.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                    </div>
                    <div className={`text-sm font-medium px-2 py-0.5 rounded-full ${growth >= 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                        {growth > 0 ? '+' : ''}{growth.toFixed(1)}% vs last month
                    </div>
                </div>
                <div className="flex-1 min-h-0">
                    <Line
                        data={{
                            labels: months.map(m => format(m, 'MMM')),
                            datasets: [{
                                label: 'Revenue',
                                data: monthlyRevenue,
                                borderColor: '#262626', // Dark gray for professional look
                                backgroundColor: 'rgba(38, 38, 38, 0.1)',
                                borderWidth: 2,
                                pointBackgroundColor: '#fff',
                                pointBorderColor: '#262626',
                                pointBorderWidth: 2,
                                pointRadius: 4,
                                pointHoverRadius: 6,
                                tension: 0.3,
                                fill: true,
                            }]
                        }}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { 
                                legend: { display: false }, 
                                tooltip: { 
                                    mode: 'index', 
                                    intersect: false,
                                    backgroundColor: '#09090b',
                                    titleColor: '#fafafa',
                                    bodyColor: '#fafafa',
                                    borderColor: '#27272a',
                                    borderWidth: 1,
                                    padding: 10,
                                    displayColors: false,
                                    callbacks: {
                                        label: (context) => ` ${context.raw.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}`
                                    }
                                } 
                            },
                            scales: {
                                x: { grid: { display: false }, ticks: { color: '#737373', font: { size: 11 } } },
                                y: { 
                                    grid: { color: '#e5e5e5', borderDash: [4, 4] }, 
                                    ticks: { display: false },
                                    beginAtZero: true
                                }
                            },
                            interaction: { mode: 'nearest', axis: 'x', intersect: false }
                        }}
                    />
                </div>
            </div>
        );
    }

    if (type === 'doughnut') {
        const categories = projects.reduce((acc, p) => {
            acc[p.category] = (acc[p.category] || 0) + 1;
            return acc;
        }, {});

        const hasData = Object.keys(categories).length > 0;

        return (
            <div className="h-[300px] flex items-center justify-center relative">
                {!hasData && <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>}
                <Doughnut
                    data={{
                        labels: Object.keys(categories),
                        datasets: [{
                            data: Object.values(categories),
                            backgroundColor: ['#262626', '#525252', '#a3a3a3', '#d4d4d4', '#e5e5e5'],
                            borderWidth: 0,
                        }]
                    }}
                    options={{
                        cutout: '75%',
                        plugins: { 
                            legend: { 
                                position: 'bottom', 
                                labels: { 
                                    color: '#525252', 
                                    usePointStyle: true, 
                                    boxWidth: 8,
                                    padding: 20,
                                    font: { size: 11 }
                                } 
                            },
                            tooltip: {
                                backgroundColor: '#09090b',
                                bodyColor: '#fafafa',
                                callbacks: {
                                    label: (c) => ` ${c.label}: ${c.raw} projects`
                                }
                            }
                        }
                    }}
                />
            </div>
        );
    }
}
