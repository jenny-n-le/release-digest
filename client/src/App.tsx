import { useState, useCallback, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";
import WeeklyDigest from "@/pages/weekly-digest";
import TierCalculator from "@/pages/tier-calculator";
import GTM from "@/pages/gtm";

function PasswordGate({
  children,
  title = "Workstream Release Digest",
  fullScreen = true,
}: {
  children: React.ReactNode;
  title?: string;
  fullScreen?: boolean;
}) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data) => setAuthenticated(data.authenticated));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthenticated(true);
        setError(false);
      } else {
        setError(true);
      }
    },
    [password]
  );

  if (authenticated === null) return null;
  if (authenticated) return <>{children}</>;

  return (
    <div className={fullScreen ? "min-h-screen flex items-center justify-center bg-muted/30" : "flex-1 flex items-center justify-center"}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8 space-y-5"
      >
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the secret code to continue. 🤫
          </p>
        </div>
        <div className="space-y-2">
          <input
            data-testid="input-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            autoFocus
          />
          {error && (
            <p data-testid="text-password-error" className="text-sm text-destructive">
              Incorrect password. Please try again.
            </p>
          )}
        </div>
        <button
          data-testid="button-login"
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={WeeklyDigest} />
      <Route path="/epd/tier-calculator" component={TierCalculator} />
<Route path="/gtm" component={GTM} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <PasswordGate>
          <AppLayout>
            <Router />
          </AppLayout>
        </PasswordGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
