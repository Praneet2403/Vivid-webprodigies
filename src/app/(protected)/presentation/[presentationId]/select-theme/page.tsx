import React from 'react'
import ThemePreview from './_components/ThemePreview'

// Slide and image generation runs as a server action from this page and can take a few minutes
export const maxDuration = 300

type Props = {}

const Page = (props: Props) => {
  return (
    <ThemePreview/>
  )
}

export default Page