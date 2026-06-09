import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { MobileHeader } from '@/components/layout/MobileHeader';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('parent_profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  const username =
    profile?.username ||
    (user.user_metadata?.username as string) ||
    user.email?.split('@')[0] ||
    'parent';

  return (
    <div className="dashboard-bg min-h-screen">
      <Sidebar username={username} />
      <MobileHeader username={username} />
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
