import { ContentItem } from "@/lib/types";
import React from "react";
import { motion } from "framer-motion";

type MasterRecursiveComponentProps = {
    content: ContentItem[]
    onContentChange: (
        contentId :string,
        newContent :string | string[] | string[][]
    ) => void
    isPreview? : boolean
    isEditable? : boolean
    slideId: string
    index? : number
    
}
const ContentRenderer: React.FC<MasterRecursiveComponentProps> = React.memo(
    ({ content, onContentChange, slideId, index }) => {
      switch (content.type) {
        case 'heading1':
          return <motion.div className="w-full h-full">
  
          </motion.div>
        default:
      }
    }
  )

// export default MasterRecursiveComponent

