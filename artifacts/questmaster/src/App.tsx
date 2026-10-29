import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import MobileBottomNav from "@/components/MobileBottomNav";
import ScrollToTop from "@/components/ScrollToTop";
import CommandPalette from "@/components/CommandPalette";
import MobileBanner from "@/components/MobileBanner";
import SiteAmbientMusic from "@/components/SiteAmbientMusic";
import CookieBanner from "@/components/CookieBanner";
import CookiePreferencesDialog from "@/components/CookiePreferencesDialog";
import BugReportButton from "@/components/BugReportButton";
import RouteFallback from "@/components/RouteFallback";
// The landing page stays in the main bundle (first paint); every other page is
// loaded on demand so visitors never download the tabletop or PDF tools upfront.
import Index from "./pages/Index";
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const Characters = lazy(() => import("./pages/Characters"));
const Compendium = lazy(() => import("./pages/Compendium"));
const Library = lazy(() => import("./pages/Library"));
const Atelier = lazy(() => import("./pages/Atelier"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DiceRoller = lazy(() => import("./pages/DiceRoller"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const CampaignPlay = lazy(() => import("./pages/CampaignPlay"));
const NotFound = lazy(() => import("./pages/NotFound"));
const JoinCampaign = lazy(() => import("./pages/JoinCampaign"));
const Partners = lazy(() => import("./pages/Partners"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const Guide = lazy(() => import("./pages/Guide"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const SystemsIndex = lazy(() => import("./pages/systems/Index"));
const GlyphesHub = lazy(() => import("./pages/systems/glyphes/Hub"));
const GlyphesNouvelEmpire = lazy(() => import("./pages/systems/glyphes/NouvelEmpire"));
const GlyphesCompendium = lazy(() => import("./pages/systems/glyphes/Compendium"));
const GlyphesComingSoon = lazy(() => import("./pages/systems/glyphes/ComingSoon"));
const legalPage = <K extends keyof typeof import("./pages/legal/LegalPages")>(name: K) =>
  lazy(() => import("./pages/legal/LegalPages").then((m) => ({ default: m[name] as React.ComponentType })));
const LegalNotices = legalPage("LegalNotices");
const TermsOfUse = legalPage("TermsOfUse");
const TermsOfSale = legalPage("TermsOfSale");
const PrivacyPolicy = legalPage("PrivacyPolicy");
const CookiesPolicy = legalPage("CookiesPolicy");
const CreditsLicenses = legalPage("CreditsLicenses");
const Withdrawal = legalPage("Withdrawal");
const RefundPolicy = legalPage("RefundPolicy");
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { setTokenGetter } from "@/lib/api";
import { useApplyCosmetics } from "@/hooks/useCosmetics";
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

function CosmeticsApplier() {
  useApplyCosmetics();
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
      <CosmeticsApplier />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/sign-in/*" element={<Auth />} />
        <Route path="/sign-up/*" element={<Auth />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
        <Route path="/campaigns/:id" element={<ProtectedRoute><CampaignPlay /></ProtectedRoute>} />
        <Route path="/characters" element={<ProtectedRoute><Characters /></ProtectedRoute>} />
        <Route path="/compendium" element={<Compendium />} />
        <Route path="/dice" element={<DiceRoller />} />
        <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
        <Route path="/atelier" element={<ProtectedRoute><Atelier /></ProtectedRoute>} />
        <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
        
        <Route path="/join/:code" element={<JoinCampaign />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/mentions-legales" element={<LegalNotices />} />
        <Route path="/cgu" element={<TermsOfUse />} />
        <Route path="/cgv" element={<TermsOfSale />} />
        <Route path="/confidentialite" element={<PrivacyPolicy />} />
        <Route path="/cookies" element={<CookiesPolicy />} />
        <Route path="/credits-licences" element={<CreditsLicenses />} />
        <Route path="/retractation" element={<Withdrawal />} />
        <Route path="/politique-remboursement" element={<RefundPolicy />} />
        <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
        <Route path="/systems" element={<SystemsIndex />} />
        <Route path="/systems/glyphes" element={<GlyphesHub />} />
        <Route path="/systems/glyphes/nouvel-empire" element={<GlyphesNouvelEmpire />} />
        <Route path="/systems/glyphes/compendium" element={<GlyphesCompendium />} />
        <Route path="/systems/glyphes/present" element={<GlyphesComingSoon era="present" />} />
        <Route path="/systems/glyphes/futur" element={<GlyphesComingSoon era="futur" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <CommandPalette />
      <MobileBottomNav />
      <CookieBanner />
      <CookiePreferencesDialog />
      <BugReportButton />
      <MobileBanner />
      <SiteAmbientMusic />

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
