"use client"
import { JsonValue } from '@prisma/client/runtime/library'
import React from 'react'
import { motion } from 'framer-motion'
import { itemVariants , themes} from '@/lib/constants'
import { useSlideStore } from '@/store/useSlideStore'
import { useRouter } from 'next/navigation'
import ThumbnailPreview from './thumbnail-preview'
import { timeAgo } from '@/lib/utils'
// import { timeAgo } from '@/lib/utils'

type Props = {
    projectId: string
    title: string
    createdAt: string
    src  : string
    isDelete?: boolean
    slideData: JsonValue
    themeName : string
}

const ProjectCard = ({
    projectId,
    title,
    createdAt,
    src,
    isDelete,
    slideData,
    themeName
}: Props) => {
    const {setSlides} = useSlideStore()
    const router = useRouter()
    const handleNavigation = () => {
        setSlides(JSON.parse(JSON.stringify(slideData)))
        router.push(`/presentation/${projectId}`)
    }

    const theme = themes.find((theme) => theme.name === themeName) || themes[0]
  return (
  <motion.div
    className={`group w-full flex flex-col gap-y-3 rounded-xl p-3 transition-colors ${
      !isDelete && 'hover:bg-muted/50'
    }`}
    variants={itemVariants}
  >
    <div
      className="relative aspect-[16/10] overflow-hidden rounded-lg cursor-pointer"
      onClick={handleNavigation}
    >
      <ThumbnailPreview theme = {theme} 
      //WIP: add the slide data
    //   slide={JSON.parse(JSON.stringify(slideData))?.[0]}
      />
    </div>

    <div className="w-full">
        <div className="space-y-1">
            <h3 className='font-semibold text-base text-primary line-clamp-1'>
                {title}
            </h3>
            <div className="flex w-full justify-between items-center gap-2">
                <p className='text-sm text-muted-foreground'
                suppressContentEditableWarning
                >
                    {timeAgo(createdAt) ?? ""}
                </p>
            </div>
        </div>
    </div>
  </motion.div>
)

}

export default ProjectCard