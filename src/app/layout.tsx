import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/providers/query-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'LexFlow — Law Firm Management System',
    template: '%s | LexFlow',
  },
  description:
    'Professional cloud-based law firm management for legal teams. Manage clients, cases, hearings, billing, and team collaboration in one place.',
  keywords: ['law firm management', 'legal software', 'case management', 'legal billing', 'law practice management'],
  authors: [{ name: 'LexFlow' }],
  creator: 'LexFlow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'LexFlow — Law Firm Management System',
    description: 'Professional cloud-based law firm management for legal teams.',
    siteName: 'LexFlow',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LexFlow — Law Firm Management System',
    description: 'Professional cloud-based law firm management for legal teams.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <TooltipProvider delay={300}>
              {children}
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
