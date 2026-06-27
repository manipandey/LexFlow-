import { ReactNode } from 'react'
import Link from 'next/link'
import { Scale } from 'lucide-react'

export default function PublicFirmLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] font-sans selection:bg-blue-600 selection:text-white">
      <header className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl shadow-lg shadow-blue-500/30 text-white">
              <Scale className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">LexFlow</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              Lawyer Login
            </Link>
            <div className="hidden sm:block h-8 w-px bg-slate-200"></div>
            <a href="#book" className="hidden sm:inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-full shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5">
              Book Consultation
            </a>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-slate-600" />
            <span className="font-bold text-xl tracking-tight text-slate-200">LexFlow</span>
          </div>
          <p className="text-sm">Powered by <span className="font-bold text-white">LexFlow</span> &mdash; The Modern Law Firm Operating System.</p>
        </div>
      </footer>
    </div>
  )
}
