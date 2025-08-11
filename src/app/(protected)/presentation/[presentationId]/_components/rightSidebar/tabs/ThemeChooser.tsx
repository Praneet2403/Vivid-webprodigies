import react from 'react'
import { useSlideStore } from '@/store/useSlideStore'
import { useTheme } from 'next-themes'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { themes } from '@/lib/constants'
import { Theme } from '@/lib/types'
import { toast } from 'sonner'
import { updateTheme } from '@/actions/projects'

const ThemeChooser = () => {
    const { currentTheme, setCurrentTheme, project } = useSlideStore()
    const { setTheme } = useTheme()
    const handleThemeChange = async (theme: Theme) => {
        if (!project) {
          toast.error('Error', {
            description: 'Failed to update theme',
          });
          return;
        }
      
        setTheme(theme.type);
        setCurrentTheme(theme);
      
        try {
          const res = await updateTheme(project.id, theme.name);
          if(res.status !== 200) {
            toast.error('Error', {
              description: 'Failed to update theme',
            });
          }
          toast.success('success', {
            description: 'Theme updated successfully!',
          });
        } catch (error) {
            console.error(error)
            toast.error('Error', {
              description: 'Failed to update theme',
            });
        }
      };
    return (
        <ScrollArea className="h-[400px]">
            <div className="mb-4 text-center font-bold">Themes</div>
            <div className="flex flex-col space-y-4">
                {themes.map((theme) => (
                    <Button
                        onClick={() => handeThemeChange(theme)}
                        key={theme.name}
                        variant={currentTheme.name === theme.name ? 'default' : 'outline'}
                        className="flex flex-col items-center justify-start px-4 w-full h-auto"
                        style={{
                            fontFamily: theme.fontFamily,
                            color: theme.fontColor,
                            background: theme.gradientBackground || theme.backgroundColor,
                        }}
                    >
                        <div className="w-full items-center flex justify-center">
                            <span className='text-xl font-bold'>
                                {theme.name}
                            </span>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.accentColor }}></div>
                            <div className="space-y-1 w-full" >
                                <div className="text-2xl font-bold" style={{color : theme.accentColor}}>
                                    Title
                                </div>
                                <div className="text-base opacity-80" >
                                    Body & <span style={{color : theme.accentColor}}>link</span>
                                </div>
                            </div>
                        </div>
                    </Button>
                ))}
            </div>
        </ScrollArea>
    )
}


export default ThemeChooser
