import CreatePageSkeleton from './_components/CreatePage/CreataPageSkeleton'
import React, { Suspense } from 'react'
import RenderPage from './_components/RenderPage'
import { onAuthenticateUser } from '@/actions/user'
import { redirect } from 'next/navigation'


type Props = {}

const Page= async (props: Props) => {

    const checkUser = await onAuthenticateUser();
    if (checkUser.status === 403) {
        redirect('/sign-in');
    }
    if (!checkUser.user) {
        throw new Error('Could not load your account. Please try again.');
    }
    // Payments are optional; only require a subscription when LemonSqueezy is set up
    if (process.env.LEMON_SQUEEZY_API_KEY && !checkUser.user.subscription) {
        redirect('/dashboard');
    }

  return (
   <main 
   className='w-full h-full pt-6'
   >
    <Suspense fallback={<CreatePageSkeleton />}>
        <RenderPage />
    </Suspense>
   </main>
  )
}

export default Page