import { SignIn } from '@clerk/nextjs'
import React from 'react'


const Signin = () => {
  return (
    <SignIn forceRedirectUrl="/callback" fallbackRedirectUrl="/callback" />
  )
}

export default Signin