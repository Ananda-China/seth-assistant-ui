"use client";

import AdminDashboard from './AdminDashboard';

interface AdminUser {
  username: string;
  role: string;
  exp: number;
}

interface AdminDashboardWrapperProps {
  currentUser: AdminUser;
}

export default function AdminDashboardWrapper({ currentUser }: AdminDashboardWrapperProps) {
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
      <AdminDashboard currentUser={currentUser} />
    </main>
  );
}

