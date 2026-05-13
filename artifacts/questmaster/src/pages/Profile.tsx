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
import { Loader2, User, Mail, Calendar, Save, Upload, Trash2 } from 'lucide-react';
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
    setIsUploadingAvatar(true);
    try {
      const path = `${user.id}/avatar-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/png', cacheControl: '3600' });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      await updateMutation.mutateAsync({ avatar_url: pub.publicUrl });
      cancelCrop();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Échec du téléchargement';
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
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
