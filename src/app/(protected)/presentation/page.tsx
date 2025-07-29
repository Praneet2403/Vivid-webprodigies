import { redirect } from 'next/navigation'
import React from 'react'

type Props = {}

const Page = (props: Props) => {
    redirect('/dashboard');  // Redirect to dashboard page when page loads)
}

export default Page