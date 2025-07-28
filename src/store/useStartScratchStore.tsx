import { OutlineCard } from '@/lib/types'
import { Project } from '@prisma/client'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

type OutlineStore = {
  outlines: OutlineCard[]
  resetOutlines: () => void
  addOutline: (outline: OutlineCard) => void
  addMultipleOutlines: (outlines: OutlineCard[]) => void
  // setProject: (project: Project) => void;
}

const useScratchStore = create<OutlineStore>()(
  devtools(
    persist(
      (set) => ({
        outlines: [],
        resetOutlines: () => {
          set({ outlines: [] })
        },
        addOutline: (outline: OutlineCard) => {
          set((state) => ({
            outlines: [...state.outlines, outline],
          }))
        },
        addMultipleOutlines: (outlines: OutlineCard[]) => {
          set(() => ({
            outlines: [...outlines],
          }))
        },
      }),
      { name: 'scratch' }
    )
  )
)

export default useScratchStore