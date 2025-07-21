// src/app/(protected)/(pages)/(dashboardPages)/dashboard/layout.tsx
// 'use client'; // Optional, only if you need client components

import { getRecentProjects } from '@/actions/projects';
import { onAuthenticateUser } from '@/actions/user';
import AppSidebar from '@/components/global/app-sidebar';
import UpperInfoBar from '@/components/global/upper-info-bar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { redirect } from 'next/navigation';
import React from 'react';

type Props = {
  children: React.ReactNode;
};

const Layout =  async ({ children }: Props) => {
  const recentProjects = await getRecentProjects();

  const checkUser = await onAuthenticateUser();

  if (!checkUser.user) {
    redirect('/sign-in');
  }

  return (
    <SidebarProvider>
      <AppSidebar user = {checkUser.user} recentProjects={recentProjects.data || []} />
      {/* <main className="flex-1">{children}</main> */}

      <SidebarInset>
        <UpperInfoBar user={checkUser.user} />
         <div className="p-4"> {children} </div>
      </SidebarInset>


    </SidebarProvider>
  );
}

export default Layout;
