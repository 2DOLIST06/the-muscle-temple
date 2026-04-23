import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { isAdminAuthenticated } from '@/lib/admin/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect('/admin/login');
  }

  return <AdminShell>{children}</AdminShell>;
}
