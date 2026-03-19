import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Sword, Sparkles, UserRound } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().trim().email({ message: "Adresse email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
  displayName: z.string().trim().max(50, { message: "Le nom doit faire moins de 50 caractères" }).optional()
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, signUp, signIn } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = authSchema.safeParse({ email, password, displayName: displayName || undefined });
    if (!validation.success) {
      toast({
        title: "Erreur de validation",
        description: validation.error.errors[0].message,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUp(email, password, displayName || undefined);
    setIsSubmitting(false);

    if (error) {
      let message = error.message;
      if (error.message.includes('already registered')) {
        message = "Cette adresse email est déjà utilisée";
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        message = "Erreur réseau. Vérifiez votre connexion et réessayez.";
      }
      toast({
        title: "Erreur d'inscription",
        description: message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Inscription réussie !",
        description: "Bienvenue, aventurier !"
      });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: "Erreur de validation",
        description: validation.error.errors[0].message,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    setIsSubmitting(false);

    if (error) {
      let message = error.message;
      if (error.message.includes('Invalid login credentials')) {
        message = "Email ou mot de passe incorrect";
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        message = "Erreur réseau. Vérifiez votre connexion et réessayez.";
      } else if (error.message.includes('Email not confirmed')) {
        message = "Veuillez confirmer votre email avant de vous connecter.";
      }
      toast({
        title: "Erreur de connexion",
        description: message,
        variant: "destructive"
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer votre adresse email.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    setIsSubmitting(false);
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'email de réinitialisation.",
        variant: "destructive"
      });
    } else {
      setResetEmailSent(true);
      toast({
        title: "Email envoyé !",
        description: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe."
      });
    }
  };

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    const guestEmail = 'guest@taverne.com';
    const guestPassword = 'guest123456!';

    try {
      // Ensure guest account exists and is confirmed via edge function
      const { data: fnData, error: fnError } = await supabase.functions.invoke('guest-login');
      
      if (fnError) {
        console.error('Guest setup error:', fnError);
      }

      // Now sign in
      const { error } = await signIn(guestEmail, guestPassword);

      if (error) {
        let message = "Impossible de se connecter en tant qu'invité.";
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          message = "Erreur réseau. Vérifiez votre connexion et réessayez.";
        }
        toast({
          title: "Connexion invité indisponible",
          description: message,
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Connexion invité indisponible",
        description: "Une erreur est survenue. Réessayez plus tard.",
        variant: "destructive"
      });
    }

    setIsGuestLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md bg-gradient-card border-border shadow-card relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Shield className="h-16 w-16 text-primary glow-gold" />
              <Sword className="h-8 w-8 text-primary absolute -right-2 -bottom-1 rotate-45" />
            </div>
          </div>
          <CardTitle className="text-3xl text-gradient-gold">Taverne des Héros</CardTitle>
          <CardDescription className="text-muted-foreground">
            Connectez-vous pour gérer vos personnages et aventures
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Connexion
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Inscription
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="mt-6">
              {forgotPassword ? (
                resetEmailSent ? (
                  <div className="text-center space-y-4">
                    <p className="text-foreground">📧 Un email de réinitialisation a été envoyé à <strong>{email}</strong>.</p>
                    <p className="text-sm text-muted-foreground">Vérifiez votre boîte mail (et vos spams).</p>
                    <Button
                      variant="link"
                      className="text-primary"
                      onClick={() => { setForgotPassword(false); setResetEmailSent(false); }}
                    >
                      Retour à la connexion
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Entrez votre email pour recevoir un lien de réinitialisation.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-foreground">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="aventurier@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-secondary border-border focus:border-primary"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-gold hover:opacity-90 text-primary-foreground font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        "Envoyer le lien"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      className="w-full text-muted-foreground"
                      onClick={() => setForgotPassword(false)}
                    >
                      Retour à la connexion
                    </Button>
                  </form>
                )
              ) : (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-foreground">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="aventurier@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-secondary border-border focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password" className="text-foreground">Mot de passe</Label>
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() => setForgotPassword(true)}
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-secondary border-border focus:border-primary"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-gold hover:opacity-90 text-primary-foreground font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Se connecter
                      </>
                    )}
                  </Button>
                </form>
              )}
            </TabsContent>
            
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-foreground">Nom d'aventurier (optionnel)</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Gandalf le Gris"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-secondary border-border focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-foreground">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="aventurier@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-secondary border-border focus:border-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-foreground">Mot de passe</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-secondary border-border focus:border-primary"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-gold hover:opacity-90 text-primary-foreground font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inscription...
                    </>
                  ) : (
                    <>
                      <Sword className="mr-2 h-4 w-4" />
                      Rejoindre l'aventure
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-border hover:bg-secondary"
            onClick={handleGuestLogin}
            disabled={isGuestLoading}
          >
            {isGuestLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion...
              </>
            ) : (
              <>
                <UserRound className="mr-2 h-4 w-4" />
                Connexion Invité (sans compte)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
