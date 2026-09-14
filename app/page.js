import Dashboard from '@/components/Dashboard';

export const metadata = {
  title: 'Agency Pulse | Manage Growth',
  description: 'Track your agency projects, revenue and growth in one place.',
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <Dashboard initialTab="dashboard" />
    </main>
  );
}
