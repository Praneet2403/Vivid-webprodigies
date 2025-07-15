'use client'
import { Button } from '@/components/ui/button'
import { User } from '@prisma/client'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'


const NewProjectButton = ({user}: {user: User}) => {
    //WIP: handle click to create a new project
    const router = useRouter()
  return (
    <Button
    className='rounded-lg font-semibold'
    disabled={!user.subscription}
    // onClick={() }
    >
        <Plus />
        New Project
    </Button>
  )
}

export default NewProjectButton