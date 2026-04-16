import { Link, useLocation } from "wouter";
import logoImg from "@assets/5e08dcec-6c6d-4c5a-a3e2-3f47109160f2_1776317432015.png";
import { Compass, Home, User } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto w-full bg-card border-x border-border shadow-2xl relative">
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-center">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <img src={logoImg} alt="Minute Ahead" className="h-16 w-auto object-contain mix-blend-multiply" />
        </Link>
      </header>

      <main className="flex-1 pb-24 overflow-x-hidden">
        {children}
      </main>

      <nav className="fixed bottom-0 w-full max-w-md bg-card/95 backdrop-blur-md border-t border-border px-6 py-3 flex items-center justify-between pb-safe z-50">
        <Link href="/" className={`flex flex-col items-center gap-1 transition-colors ${location === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
          <Home className="w-6 h-6" strokeWidth={location === '/' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link href="/browse" className={`flex flex-col items-center gap-1 transition-colors ${location === '/browse' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
          <Compass className="w-6 h-6" strokeWidth={location === '/browse' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Browse</span>
        </Link>
        <Link href="/onboarding" className={`flex flex-col items-center gap-1 transition-colors ${location === '/onboarding' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
          <User className="w-6 h-6" strokeWidth={location === '/onboarding' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Settings</span>
        </Link>
      </nav>
    </div>
  );
}
