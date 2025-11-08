import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '../../../lib/adminAuth';
import AdminDashboardWrapper from '../components/AdminDashboardWrapper';

export default async function AdminCatchAllPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;

  // 如果没有 token，重定向到登录页面
  if (!adminToken) {
    redirect('/admin/login');
  }

  // 验证 token
  const adminUser = verifyAdminToken(adminToken);
  if (!adminUser) {
    redirect('/admin/login');
  }

  // 如果是根admin路径或任何子路径，显示主面板
  return <AdminDashboardWrapper currentUser={adminUser} />;
}
