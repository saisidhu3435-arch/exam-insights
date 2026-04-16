import { Link, useLocation } from "wouter";
import logoImg from "@assets/logo-transparent.png";
import { Compass, Home, Bookmark } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col w-full">
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src={logoImg} alt="Minute Ahead" className="h-11 w-auto object-contain" />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                location === "/" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              href="/browse"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                location === "/browse" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">Browse</span>
            </Link>
            <Link
              href="/onboarding"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                location === "/onboarding" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="max-w-3xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
