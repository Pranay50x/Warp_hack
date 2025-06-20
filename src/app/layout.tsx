import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "../app/components/SessionProviderWrapper";
import AuthGuard from "../components/AuthGuard";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'AI Learning Assistant',
  description: 'Intelligent PDF-based learning with AI-powered quizzes and explanations',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white font-sans">
        <SessionProviderWrapper>
          <AuthGuard>
            {children}
          </AuthGuard>
        </SessionProviderWrapper>
      </body>
    </html>
  )
}