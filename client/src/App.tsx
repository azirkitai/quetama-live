import { Switch, Route, useParams } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";

// Import pages
import Dashboard from "@/pages/dashboard";
import Management from "@/pages/management";
import Register from "@/pages/register";
import Queue from "@/pages/queue";
import Settings from "@/pages/settings";
import Account from "@/pages/account";
import Administration from "@/pages/administration";
import LoginPage from "@/pages/login";
import QrAuthPage from "@/pages/qr-auth";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/management" component={Management} />
      <Route path="/register" component={Register} />
      <Route path="/queue" component={Queue} />
      <Route path="/settings" component={Settings} />
      <Route path="/account" component={Account} />
      <Route path="/administration" component={Administration} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Authenticated app content
function AuthenticatedApp() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Custom sidebar width for clinic system
  const style = {
    "--sidebar-width": "20rem",       // 320px for better content
    "--sidebar-width-icon": "4rem",   // default icon width
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        {/* Hide sidebar when in fullscreen */}
        {!isFullscreen && <AppSidebar />}
        <div className="flex flex-col flex-1">
          {/* Hide header when in fullscreen */}
          {!isFullscreen && (
            <header className="flex items-center justify-between p-2 border-b bg-background">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <ThemeToggle />
            </header>
          )}
          <main className={`flex-1 ${isFullscreen ? 'h-screen' : 'overflow-auto'}`}>
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// QR Auth component wrapper to get param from wouter
function QrAuthWrapper() {
  const params = useParams();
  const sessionId = params.id || '';
  return <QrAuthPage sessionId={sessionId} />;
}

// Main app with authentication logic  
function AppContent() {
  const { isAuthenticated, isLoading, login } = useAuth();

  return (
    <Switch>
      {/* QR Auth route - accessible without authentication */}
      <Route path="/qr-auth/:id">
        <QrAuthWrapper />
      </Route>
      
      {/* All other routes require authentication check */}
      <Route>
        {() => {
          if (isLoading) {
            return (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-muted-foreground">Memeriksa sesi login...</p>
                </div>
              </div>
            );
          }

          if (!isAuthenticated) {
            return <LoginPage onLoginSuccess={login} />;
          }

          return <AuthenticatedApp />;
        }}
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="light" storageKey="clinic-ui-theme">
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
