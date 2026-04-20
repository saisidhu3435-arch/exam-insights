import { Link, useLocation } from "wouter";
import { Compass, BookOpen, User } from "lucide-react";
import { useStreak } from "@/hooks/use-streak";
import { useUser } from "@clerk/react";

function AnimatedFireStreak({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-1 bg-orange-100 border border-orange-200 rounded-full px-2.5 py-1 select-none">
      <span className="text-base leading-none" style={{ animation: "fireWiggle 0.8s ease-in-out infinite alternate" }}>
        🔥
      </span>
      <span className="text-xs font-extrabold text-orange-600">{count}</span>
    </div>
  );
}

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="14" cy="14" r="14" fill="hsl(var(--primary))" />
      {/* Clock face */}
      <circle cx="14" cy="14" r="9" stroke="white" strokeWidth="1.5" fill="none" />
      {/* Hour hand pointing to 12 */}
      <line x1="14" y1="14" x2="14" y2="7.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      {/* Minute hand pointing to 1 (slightly past) */}
      <line x1="14" y1="14" x2="18" y2="11" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx="14" cy="14" r="1.2" fill="white" />
    </svg>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { streak } = useStreak();
  const { user } = useUser();

  return (
    <div className="min-h-[100dvh] flex flex-col w-full">
      <style>{`
        @keyframes fireWiggle {
          0%   { transform: rotate(-12deg) scale(1);   }
          50%  { transform: rotate(0deg)  scale(1.15); }
          100% { transform: rotate(12deg) scale(1);    }
        }
      `}</style>

      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Logo + brand */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity mr-auto">
            <Logo />
            <span className="font-black text-lg leading-none tracking-tight text-foreground">
              Minute<span className="text-primary"> Ahead</span>
            </span>
          </Link>

          <AnimatedFireStreak count={streak} />

          <nav className="flex items-center gap-0.5">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
                location === "/" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">News</span>
            </Link>
            <Link
              href="/browse"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
                location === "/browse" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">Browse</span>
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-1 py-1 rounded-full transition-all hover:opacity-80"
            >
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="Profile"
                  className={`w-8 h-8 rounded-full object-cover ${location === "/profile" ? "ring-2 ring-primary" : "ring-2 ring-border"}`}
                />
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  location === "/profile" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                }`}>
                  <User className="w-4 h-4" />
                </div>
              )}
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
