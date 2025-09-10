import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '../../../lib/adminAuth';
import AdminDashboard from '../components/AdminDashboard';

export default async function AdminCatchAllPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const cookieStore = cookies();
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
  return (
    <main
      className="min-h-screen bg-gradient-to-b from-[#2E335B] to-[#23284A] text-[#EAEBF0]"
      style={{
        paddingTop: 0,
        marginTop: 0,
        position: 'relative',
        zIndex: 1
      }}
    >
      <AdminDashboard currentUser={adminUser} />
    </main>
  );
}
