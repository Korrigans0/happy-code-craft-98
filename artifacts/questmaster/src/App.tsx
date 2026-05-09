import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import MobileBottomNav from "@/components/MobileBottomNav";
import CookieBanner from "@/components/CookieBanner";
import Index from "./pages/Index";
import Campaigns from "./pages/Campaigns";
import Characters from "./pages/Characters";
import Compendium from "./pages/Compendium";
import DiceRoller from "./pages/DiceRoller";
import Profile from "./pages/Profile";
import CampaignPlay from "./pages/CampaignPlay";
import NotFound from "./pages/NotFound";
import { useUser } from "@clerk/react";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;

const clerkAppearance = {
  baseTheme: shadcn,
  variables: {
    colorPrimary: "hsl(43, 67%, 47%)",
    colorForeground: "hsl(43, 25%, 88%)",
    colorMutedForeground: "hsl(213, 20%, 60%)",
    colorDanger: "hsl(0, 72%, 51%)",
    colorBackground: "hsl(213, 52%, 18%)",
    colorInput: "hsl(213, 48%, 22%)",
    colorInputForeground: "hsl(43, 25%, 88%)",
    colorNeutral: "hsl(213, 40%, 35%)",
    fontFamily: "'Lora', serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "rounded-2xl w-[440px] max-w-full overflow-hidden border border-amber-500/20",
    card: "!shadow-none !border-0 !rounded-none",
    footer: "!shadow-none !border-0 !rounded-none",
    headerTitle: "text-amber-100 font-bold",
    headerSubtitle: "text-slate-400",
    socialButtonsBlockButtonText: "text-slate-200",
    formFieldLabel: "text-slate-300",
    footerActionLink: "text-amber-400 hover:text-amber-300",
    footerActionText: "text-slate-400",
    dividerText: "text-slate-500",
    identityPreviewEditButton: "text-amber-400",
    formFieldSuccessText: "text-green-400",
    alertText: "text-red-300",
    logoBox: "flex justify-center mb-2",
    formButtonPrimary: "bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold",
    formFieldInput: "border-white/10 focus:border-amber-500/60",
    footerAction: "border-t border-white/5",
    dividerLine: "bg-white/10",
  },
  layout: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  localization: {
    signIn: {
      start: {
        title: "Connexion à Aetheria",
        subtitle: "Entrez dans l'univers d'Aetheria VTT",
      },
    },
    signUp: {
      start: {
        title: "Rejoindre Aetheria",
        subtitle: "Créez votre compte d'aventurier",
      },
    },
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  return <>{children}</>;
}

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-dark px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-dark px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <BrowserRouter basename={basePath}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/sign-in/*" element={<SignInPage />} />
              <Route path="/sign-up/*" element={<SignUpPage />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
              <Route path="/campaigns/:id" element={<ProtectedRoute><CampaignPlay /></ProtectedRoute>} />
              <Route path="/characters" element={<ProtectedRoute><Characters /></ProtectedRoute>} />
              <Route path="/compendium" element={<Compendium />} />
              <Route path="/dice" element={<DiceRoller />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <MobileBottomNav />
            <CookieBanner />
          </TooltipProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  </ErrorBoundary>
);

export default App;
