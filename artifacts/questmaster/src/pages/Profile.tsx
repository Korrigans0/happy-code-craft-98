import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesApi } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Calendar, Save, Upload, Trash2, X } from 'lucide-react';
import AvatarCropDialog from '@/components/profile/AvatarCropDialog';


interface ProfileData {
  user_id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayName] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [comparison, setComparison] = useState<{ before: string | null; after: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/sign-in');
    }
  }, [user, authLoading, navigate]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      return profilesApi.getMe() as Promise<ProfileData | null>;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  // Revoke any object URLs held by the comparison snapshot when leaving the page.
  useEffect(() => {
    return () => {
      if (comparison?.before?.startsWith('blob:')) URL.revokeObjectURL(comparison.before);
      if (comparison?.after?.startsWith('blob:')) URL.revokeObjectURL(comparison.after);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissComparison = () => {
    setComparison((prev) => {
      if (prev?.before?.startsWith('blob:')) URL.revokeObjectURL(prev.before);
      if (prev?.after?.startsWith('blob:')) URL.revokeObjectURL(prev.after);
      return null;
    });
  };

  const updateMutation = useMutation({
    mutationFn: async (updates: { display_name?: string; avatar_url?: string | null }) => {
      if (!user) throw new Error('Non authentifié');
      return profilesApi.updateMe(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['headerProfile', user?.id] });
      toast({ title: 'Profil mis à jour', description: 'Vos modifications ont été enregistrées.' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le profil.', variant: 'destructive' });
    },
  });

  const handleSave = () => updateMutation.mutate({ display_name: displayName });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Format invalide', description: 'Sélectionnez une image.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image trop lourde', description: 'Maximum 5 Mo.', variant: 'destructive' });
      return;
    }
    setPendingFile(file);
    setCropOpen(true);
    if (e.target) e.target.value = '';
  };

  const cancelCrop = () => {
    setCropOpen(false);
    setPendingFile(null);
  };

  const confirmCrop = async (blob: Blob) => {
    if (!user) return;
    const previousUrl = profile?.avatar_url ?? null;
    const previousPath = (() => {
      if (!previousUrl) return null;
      const marker = '/storage/v1/object/public/avatars/';
      const idx = previousUrl.indexOf(marker);
      return idx === -1 ? null : previousUrl.substring(idx + marker.length).split('?')[0];
    })();

    setIsUploadingAvatar(true);
    let newPath: string | null = null;
    try {
      newPath = `${user.id}/avatar-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(newPath, blob, { upsert: true, contentType: 'image/png', cacheControl: '3600' });
      if (upErr) {
        const lower = upErr.message?.toLowerCase() ?? '';
        let friendly = "Impossible d'envoyer la nouvelle image. Votre avatar actuel a été conservé.";
        if (lower.includes('exceed') || lower.includes('payload') || lower.includes('too large')) {
          friendly = 'Image trop volumineuse pour le serveur. Avatar précédent conservé.';
        } else if (lower.includes('mime') || lower.includes('content-type')) {
          friendly = 'Format non accepté par le serveur. Avatar précédent conservé.';
        } else if (lower.includes('permission') || lower.includes('unauthorized') || lower.includes('not authorized')) {
          friendly = "Vous n'avez pas l'autorisation d'envoyer cet avatar. Avatar précédent conservé.";
        } else if (lower.includes('network') || lower.includes('failed to fetch')) {
          friendly = 'Problème réseau pendant l\'envoi. Avatar précédent conservé.';
        }
        throw new Error(friendly);
      }

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(newPath);
      try {
        await updateMutation.mutateAsync({ avatar_url: pub.publicUrl });
      } catch {
        // DB update failed — clean up newly uploaded file so previous avatar stays intact.
        await supabase.storage.from('avatars').remove([newPath]).catch(() => null);
        throw new Error('Image envoyée mais profil non mis à jour. Avatar précédent conservé.');
      }

      // Snapshot the previous avatar locally (as a blob URL) so the before/after
      // comparison keeps showing it even after we delete it from storage.
      let beforeSnapshot: string | null = null;
      if (previousUrl) {
        try {
          const r = await fetch(previousUrl);
          if (r.ok) beforeSnapshot = URL.createObjectURL(await r.blob());
        } catch {
          beforeSnapshot = previousUrl;
        }
      }
      const afterSnapshot = URL.createObjectURL(blob);
      setComparison((prev) => {
        if (prev?.before && prev.before.startsWith('blob:')) URL.revokeObjectURL(prev.before);
        if (prev?.after && prev.after.startsWith('blob:')) URL.revokeObjectURL(prev.after);
        return { before: beforeSnapshot, after: afterSnapshot };
      });

      // Success — best-effort cleanup of the previous file.
      if (previousPath && previousPath !== newPath) {
        await supabase.storage.from('avatars').remove([previousPath]).catch(() => null);
      }
      cancelCrop();
    } catch (err) {
      const msg = err instanceof Error && err.message
        ? err.message
        : "Échec du téléchargement. Avatar précédent conservé.";
      toast({ title: 'Échec de la mise à jour de l\'avatar', description: msg, variant: 'destructive' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !profile?.avatar_url) return;
    // Best-effort: extract storage path from public URL and remove it.
    const marker = '/storage/v1/object/public/avatars/';
    const idx = profile.avatar_url.indexOf(marker);
    if (idx !== -1) {
      const path = profile.avatar_url.substring(idx + marker.length).split('?')[0];
      await supabase.storage.from('avatars').remove([path]).catch(() => null);
    }
    updateMutation.mutate({ avatar_url: null });
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = displayName 
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="flex min-h-screen flex-col bg-gradient-dark">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-2xl px-4 md:px-6">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Mon Profil</h1>
            <p className="text-muted-foreground">Gérez vos informations personnelles</p>
          </div>
          <div className="space-y-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Avatar</CardTitle>
                <CardDescription>Votre photo de profil</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24 border-2 border-primary/30">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploadingAvatar}>
                      {isUploadingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Changer l'avatar
                    </Button>
                    {profile?.avatar_url && (
                      <Button variant="ghost" size="sm" onClick={handleRemoveAvatar} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />Supprimer
                      </Button>
                    )}
                  </div>
                </div>
                {comparison && (
                  <div className="mt-6 rounded-lg border border-primary/30 bg-secondary/40 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">Avant / Après</p>
                      <Button variant="ghost" size="sm" onClick={dismissComparison} className="h-7 px-2 text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-center gap-6">
                      <div className="flex flex-col items-center gap-2">
                        <Avatar className="h-20 w-20 border-2 border-border opacity-80">
                          {comparison.before ? (
                            <AvatarImage src={comparison.before} />
                          ) : null}
                          <AvatarFallback className="bg-muted text-muted-foreground">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">Avant</span>
                      </div>
                      <div className="text-2xl text-primary">→</div>
                      <div className="flex flex-col items-center gap-2">
                        <Avatar className="h-20 w-20 border-2 border-primary shadow-[0_0_18px_hsl(var(--primary)/0.4)]">
                          <AvatarImage src={comparison.after} />
                          <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs uppercase tracking-wide text-primary">Après</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Informations</CardTitle>
                <CardDescription>Vos informations de compte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="flex items-center gap-2 text-foreground"><User className="h-4 w-4" />Nom d'aventurier</Label>
                  <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Votre nom d'aventurier" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground"><Mail className="h-4 w-4" />Email</Label>
                  <Input value={user?.email || ''} disabled className="bg-muted border-border text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground"><Calendar className="h-4 w-4" />Membre depuis</Label>
                  <Input value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : ''} disabled className="bg-muted border-border text-muted-foreground" />
                </div>
                <Button onClick={handleSave} className="w-full bg-gradient-gold hover:opacity-90" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Enregistrer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
      <AvatarCropDialog
        file={pendingFile}
        open={cropOpen}
        onCancel={cancelCrop}
        onConfirm={confirmCrop}
        isUploading={isUploadingAvatar}
      />
    </div>
  );
};

export default Profile;
