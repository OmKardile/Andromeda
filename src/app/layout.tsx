import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Andromeda Launcher",
  description:
    "A fully interactive iOS-style launcher experience for the web — glass and blur surfaces, widgets, folders, search, wallpapers, and 24+ working app screens. Built with Next.js, TypeScript, and Tailwind CSS.",
  keywords: [
    "Andromeda",
    "launcher",
    "iOS",
    "glassmorphism",
    "Next.js",
    "TypeScript",
    "Tailwind CSS",
    "React",
  ],
  authors: [{ name: "OmKardile" }],
  openGraph: {
    title: "Andromeda Launcher",
    description: "An iOS-style launcher experience for the web",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Andromeda Launcher",
    description: "An iOS-style launcher experience for the web",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
