import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/provider/theme-provider";
import { ClerkProviderWrapper } from "@/provider/clerk-provider";
import { Toaster } from "@/components/ui/sonner";

//fonts
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

//seo
export const metadata: Metadata = {
  title: "Vivid - AI PPT Generator",
  description: "Build AI powered presentations.",
  // keywords:"apple"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ClerkProviderWrapper>
          <ThemeProvider attribute={"class"} defaultTheme="dark" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
          </ThemeProvider>
        </ClerkProviderWrapper>
      </body>
    </html>
  );
}

