import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

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
    <div className="portal-shell dashboard-bg min-h-screen w-full overflow-x-hidden">
      <Sidebar username={username} />
      <MobileNav username={username} />
      <main className="portal-main lg:pl-64">
        <div className="portal-content mx-auto w-full min-w-0 max-w-7xl px-3 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
