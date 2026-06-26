import { Scale } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-animated flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-chart-4/10 pointer-events-none" />
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-chart-2/10 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg glow-blue">
            <Scale className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">LexFlow</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Modern Law Firm
              <br />
              <span className="gradient-text">Management.</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-sm">
              Streamline your legal practice with intelligent case management, 
              client tracking, and seamless team collaboration.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-3">
            {[
              { icon: '⚖️', text: 'Complete case lifecycle management' },
              { icon: '👥', text: 'Multi-role team collaboration' },
              { icon: '📋', text: 'Automated billing & invoicing' },
              { icon: '🔒', text: 'Enterprise-grade security & compliance' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-white/80">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 glass rounded-xl p-5">
          <p className="text-white/90 text-sm italic leading-relaxed">
            "LexFlow transformed how our firm operates. Client management, case tracking, 
            and billing — all in one place. Highly recommended."
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-xs text-white font-bold">JR</div>
            <div>
              <p className="text-white text-xs font-semibold">Jonathan Reed</p>
              <p className="text-white/60 text-xs">Managing Partner, Reed & Co.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Scale className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">LexFlow</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
