import { generateLayouts } from "@/actions/chatgpt";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slide, Theme } from "@/lib/types";
import { useSlideStore } from "@/store/useSlideStore";
import { Loader2, Wand2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { themes } from "@/lib/constants";

type Props = {
  selectedTheme: Theme;
  themes: Theme[];
  onThemeSelect: (theme: Theme) => void;
};

const ThemePicker = ({ onThemeSelect, selectedTheme }: Props) => {
  const router = useRouter();
  const params = useParams();
  const { setSlides } = useSlideStore();
  const [loading, setLoading] = useState(false);
  const presentationId = params.presentationId as string;

  const handleGenerateLayouts = async () => {
    if (loading) return;
    if (!selectedTheme) {
      toast.error("Error", {
        description: "Please select a theme first.",
      });
      return;
    }
    if (!presentationId) {
      toast.error("Error", {
        description: "Please create a project first.",
      });
      router.push("/create-page");
      return;
    }
    setLoading(true);
    try {
      const res = await generateLayouts(presentationId, selectedTheme.name);

      if (res.status !== 200) {
        throw new Error(res.error || "Failed to generate layouts.");
      }
      
      // At this point, TypeScript knows res.status === 200, so res.data should exist
      const data = (res as { status: 200; data: Slide[] }).data;
      
      if (!data) {
        throw new Error("No data received from layout generation.");
      }
      
      toast.success("Success", {
        description: "Layouts generated successfully!",
      });
      setSlides(data);
      router.push(`/presentation/${presentationId}`);
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate layouts. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-[400px] overflow-hidden sticky top-0 h-screen flex flex-col"
      style={{
        backgroundColor:
          selectedTheme.sidebarColor || selectedTheme.backgroundColor,
        borderLeft: `1px solid ${selectedTheme.accentColor}20`,
      }}
    >
      <div className="p-8 space-y-6 flex-shrink-0">
        <div className="space-y-2">
          <h2
            className="text-3xl font-bold tracking-tight"
            style={{ color: selectedTheme.accentColor }}
          >
            Pick a theme
          </h2>
          <p
            className="text-sm"
            style={{ color: `${selectedTheme.accentColor}80` }}
          >
            Choose from our curated collection or generate a custom theme
          </p>
        </div>
        <Button
          className="w-full h-12 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 "
          onClick={handleGenerateLayouts}
          disabled={loading}
          style={{
            backgroundColor: selectedTheme.accentColor,
            color: selectedTheme.backgroundColor,
          }}
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-5 w-5" />
          )}
          {loading ? (
            <p className="animate-pulse">Generating...</p>
          ) : (
            "Generate Theme"
          )}
        </Button>
      </div>

      <ScrollArea className="flex-grow pb-8 px-8">
        <div className="grid grid-cols-1 gap-4">
          {themes.map((theme) => (
            <motion.div
              key={theme.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => {
                  onThemeSelect(theme);
                }}
                className="flex flex-col
                   items-center justify-start p-6
                   w-full h-auto"
                style={{
                  fontFamily: theme.fontFamily,
                  color: theme.fontColor,
                  background: theme.gradientBackground || theme.backgroundColor,
                }}
              >
                <div className="w-full flex items-center justify-center">
                  <span
                    className="text-xl font-bold"
                  >
                    {theme.name}
                  </span>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                </div>
                <div className="space-y-1 w-full">
                  <div
                    className="text-2xl font-bold"
                    style={{ color: theme.accentColor }}
                  >
                    Title
                  </div>
                  <div className="text-base opacity-80">
                     Body &{''}
                     <span style={{color: theme.accentColor}}>link</span>

                  </div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ThemePicker;
