export const dynamic = 'force-dynamic';

import { onAuthenticateUser } from '@/actions/user';
import { redirect } from 'next/navigation';
import React from 'react';

type Props = {
  children: React.ReactNode;
};

const Layout = async  (props: Props) =>  {
  const auth = await onAuthenticateUser();

  if (auth.status === 403) {
    redirect('/sign-in');
  }
  // Signed in with Clerk but the account could not be loaded: redirecting to /sign-in would loop
  if (!auth.user) {
    throw new Error('Could not load your account. Please try again.');
  }

  return <div className="w-full min-h-screen">{props.children}</div>;
}

export default Layout;