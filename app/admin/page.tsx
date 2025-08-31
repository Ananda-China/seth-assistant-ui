import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '../../lib/adminAuth';
import AdminDashboard from './components/AdminDashboard';

export default async function AdminPage() {
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

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;
