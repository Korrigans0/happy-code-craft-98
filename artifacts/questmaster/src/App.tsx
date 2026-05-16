import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import MobileBottomNav from "@/components/MobileBottomNav";
import CookieBanner from "@/components/CookieBanner";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Campaigns from "./pages/Campaigns";
import Characters from "./pages/Characters";
import Compendium from "./pages/Compendium";
import DiceRoller from "./pages/DiceRoller";
import Profile from "./pages/Profile";
import CampaignPlay from "./pages/CampaignPlay";
import NotFound from "./pages/NotFound";
import JoinCampaign from "./pages/JoinCampaign";
import Partners from "./pages/Partners";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { setTokenGetter } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function TokenSyncer() {
  useEffect(() => {
    setTokenGetter(async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    });
  }, []);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/sign-in" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <BrowserRouter basename={basePath}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <TokenSyncer />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/sign-in/*" element={<Auth />} />
        <Route path="/sign-up/*" element={<Auth />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
        <Route path="/campaigns/:id" element={<ProtectedRoute><CampaignPlay /></ProtectedRoute>} />
        <Route path="/characters" element={<ProtectedRoute><Characters /></ProtectedRoute>} />
        <Route path="/compendium" element={<Compendium />} />
        <Route path="/dice" element={<DiceRoller />} />
        <Route path="/join/:code" element={<JoinCampaign />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <MobileBottomNav />
      <CookieBanner />
    </TooltipProvider>
  </BrowserRouter>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
