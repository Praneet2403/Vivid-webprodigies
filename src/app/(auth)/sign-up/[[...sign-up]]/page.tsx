import { SignUp } from '@clerk/nextjs'
import React from 'react'


const Signup = () => {
  return (
    <SignUp forceRedirectUrl="/callback" fallbackRedirectUrl="/callback" />
  )
}

export default Signup