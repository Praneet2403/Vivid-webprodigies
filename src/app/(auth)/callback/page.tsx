import { onAuthenticateUser } from '@/actions/user';
import { redirect } from 'next/navigation';
import React from 'react'

export const dynamic = 'force-dynamic';

const AuthCallbackPage = async () => {
    const auth = await onAuthenticateUser();
    
    
    if(auth.status === 200 || auth.status === 201) {
        redirect('/dashboard');
    }else if(auth.status === 403) {
        redirect('/sign-in');
    }
    // Signed in, but the account could not be created or loaded; going back to /sign-in would loop
    throw new Error('Could not load your account. Please try again.');
}   

export default AuthCallbackPage