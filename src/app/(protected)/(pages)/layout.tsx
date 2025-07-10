import { onAuthenticateUser } from '@/actions/user';
import AppSidebar from '@/components/global/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { redirect } from 'next/navigation';
import React from 'react'

type Props = {
    children: React.ReactNode
}

const layout = async ({children}: Props) => {

    // const recent Projects = await getRecentProjects();
    const checkUser = await onAuthenticateUser();

    if (!checkUser.user) {
        redirect('/sign-in')
    }
  return (
    <SidebarProvider>
       
    </SidebarProvider>
  )
}

export default layout