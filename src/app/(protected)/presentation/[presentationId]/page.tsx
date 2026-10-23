"use client";
import { getProjectById } from "@/actions/projects";
import { themes } from "@/lib/constants";
import { Slide } from "@/lib/types";
import { useSlideStore } from "@/store/useSlideStore";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Navbar from "./_components/Navbar/Navbar";
import LayoutPreview from "./_components/editor-sidebar/leftsidebar/layoutPreview";
import Editor from "./_components/editor/Editor";
import EditorSidebar from "./_components/rightSidebar";

type Props = {};

const Page = (props: Props) => {
  //WIP: create the presentation view
  const params = useParams();
  const router = useRouter();
  const presentationId = params.presentationId as string;
  const { setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const { setSlides, setProject, currentTheme, setCurrentTheme } =
    useSlideStore();

  useEffect(() => {
    (async () => {
      try {
        const res = await getProjectById(presentationId);
        if (res.status !== 200 || !res.data) {
          toast.error("Error", {
            description: "Unable to fetch project",
          });
          router.push("/dashboard");
          return;
        }

        // Slides are generated on the theme step; send the user there if that never happened
        if (!Array.isArray(res.data.slides) || res.data.slides.length === 0) {
          setProject(res.data);
          router.replace(`/presentation/${presentationId}/select-theme`);
          return;
        }

        const findTheme = themes.find(
          (theme) => theme.name === res.data.themeName
        );
        setCurrentTheme(findTheme || themes[0]);
        setTheme(findTheme?.type === "dark" ? "dark" : "light");
        setProject(res.data);
        const slides = JSON.parse(JSON.stringify(res.data.slides)) as Slide[];
        setSlides(
          slides.map((slide, index) => ({
            ...slide,
            id: slide.id || uuidv4(),
            slideOrder:
              typeof slide.slideOrder === "number" ? slide.slideOrder : index,
          }))
        );
      } catch (error) {
        toast.error("Error", {
          description: "Failed to load project. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen flex flex-col">
        <Navbar presentationId={presentationId} />
        <div
          className="flex-1 flex overflow-hidden pt-16"
          style={{
            color: currentTheme.accentColor,
            fontFamily: currentTheme.fontFamily,
            backgroundColor: currentTheme.backgroundColor,
          }}
        >
          <LayoutPreview />
          <div className="flex-1 ml-64 pr-16">
            <Editor isEditable={true} />
          </div>
            <EditorSidebar />

        </div>
      </div>
    </DndProvider>
  );
};

export default Page;
