import { Link } from "wouter";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-6 text-7xl font-black text-primary/20 select-none tracking-tight">
        404
      </div>

      <h1 className="text-2xl font-extrabold text-foreground mb-2">
        Page not found
      </h1>
      <p className="text-muted-foreground text-sm max-w-xs mb-8">
        This page doesn't exist or may have been moved. Head back home to continue reading.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link href="/" className="flex-1">
          <button className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold rounded-xl px-5 py-3 hover:bg-primary/90 transition-colors">
            <Home className="h-4 w-4" />
            Go home
          </button>
        </Link>
        <button
          onClick={() => window.history.back()}
          className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-semibold rounded-xl px-5 py-3 hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>
      </div>
    </div>
  );
}
