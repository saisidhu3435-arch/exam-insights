import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/layout";
import { HomePage } from "@/pages/home";
import { OnboardingPage } from "@/pages/onboarding";
import { ArticlePage } from "@/pages/article";
import { BrowsePage } from "@/pages/browse";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/">
        <Layout>
          <HomePage />
        </Layout>
      </Route>
      <Route path="/browse">
        <Layout>
          <BrowsePage />
        </Layout>
      </Route>
      <Route path="/article/:id">
        <Layout>
          <ArticlePage />
        </Layout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
