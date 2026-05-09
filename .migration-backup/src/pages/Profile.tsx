import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

import type { Tables } from "@/integrations/supabase/types";

type ProfileData = Tables<"profiles">;

const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayName] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('character-avatars').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('character-avatars').getPublicUrl(filePath);
      await updateMutation.mutateAsync({ avatar_url: publicUrl });
    } catch {
      toast({ title: 'Erreur', description: "Impossible de télécharger l'avatar.", variant: 'destructive' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => updateMutation.mutate({ avatar_url: null });

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
                  <Input value={user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : ''} disabled className="bg-muted border-border text-muted-foreground" />
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
    </div>
  );
};

export default Profile;
