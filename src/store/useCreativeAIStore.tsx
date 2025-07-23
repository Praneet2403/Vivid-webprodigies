import { OutlineCard } from '@/lib/types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CreativeAIStore = {
  outlines: OutlineCard[] | [];
  addMultipleOutlines: (outlines: OutlineCard[]) => void;
  addOutline: (outline: OutlineCard) => void;
}

const useCreativeAIStore = create<CreativeAIStore>()(
  persist((set) => ({
    outlines: [],
    addOutline: (outline: OutlineCard) => {
      set((state) => ({
        outlines: [outline, ...state.outlines],
      }));
    },
    addMultipleOutlines: () => ({}),
  }), {
    name: "creative-ai", // storage key for the persisted store
  })
)