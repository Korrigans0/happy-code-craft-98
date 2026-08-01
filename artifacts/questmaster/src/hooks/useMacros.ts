// useMacros — CRUD + réordonnancement des macros d'une campagne.
// Chaque utilisateur voit ses propres macros et les macros de table partagées
// par le MJ (lecture seule pour lui). Les règles d'accès sont appliquées côté
// base de données ; ce hook ne fait que présenter les données.

import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { Macro, MacroDraft } from "@/lib/macros/types";
import { getDefaultMacros } from "@/lib/macros/defaults";

function normalize(row: any): Macro {
  return {
    ...row,
    actions: Array.isArray(row.actions) ? row.actions : [],
  } as Macro;
}

export function useMacros(campaignId?: string) {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["macros", campaignId ?? "global", userId], [campaignId, userId]);

  const { data: macros = [], isLoading } = useQuery({
    queryKey,
    enabled: !!userId,
    queryFn: async () => {
      let query = supabase.from("macros").select("*").order("sort_order", { ascending: true });
      if (campaignId) {
        query = query.or(`campaign_id.eq.${campaignId},campaign_id.is.null`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(normalize);
    },
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const createMacro = useMutation({
    mutationFn: async (draft: MacroDraft) => {
      if (!userId) throw new Error("Non authentifié");
      const { data, error } = await supabase
        .from("macros")
        .insert({ ...draft, actions: draft.actions as any, owner_user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return normalize(data);
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Macro créée" });
    },
    onError: (e: any) =>
      toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const updateMacro = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<MacroDraft> }) => {
      const { data, error } = await supabase
        .from("macros")
        .update({ ...patch, actions: patch.actions as any })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return normalize(data);
    },
    onSuccess: invalidate,
    onError: (e: any) =>
      toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const deleteMacro = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("macros").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Macro supprimée" });
    },
  });

  const duplicateMacro = useCallback(
    (macro: Macro) => {
      const { id, owner_user_id, created_at, updated_at, ...rest } = macro;
      createMacro.mutate({ ...rest, name: `${macro.name} (copie)`, sort_order: macro.sort_order + 1 });
    },
    [createMacro],
  );

  /** Réordonnancement : applique un nouvel ordre à une liste de macros. */
  const reorder = useMutation({
    mutationFn: async (ordered: Macro[]) => {
      await Promise.all(
        ordered.map((m, i) =>
          supabase.from("macros").update({ sort_order: i }).eq("id", m.id),
        ),
      );
    },
    onSuccess: invalidate,
  });

  /** Crée les macros de base d'un système pour un personnage donné. */
  const seedDefaults = useCallback(
    async (opts: { system: string; characterId?: string | null; campaignId?: string | null }) => {
      if (!userId) return;
      const rows = getDefaultMacros(opts.system).map((d, i) => ({
        owner_user_id: userId,
        campaign_id: opts.campaignId ?? null,
        character_id: opts.characterId ?? null,
        system: opts.system,
        name: d.name,
        category: d.category,
        icon: d.icon ?? null,
        color: d.color ?? null,
        actions: d.actions as any,
        is_shared: false,
        is_private_roll: false,
        sort_order: i,
      }));
      const { error } = await supabase.from("macros").insert(rows);
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        return;
      }
      invalidate();
      toast({ title: "Macros de base ajoutées", description: `${rows.length} macros créées.` });
    },
    [userId, invalidate],
  );

  const mine = useMemo(() => macros.filter((m) => m.owner_user_id === userId), [macros, userId]);
  const shared = useMemo(
    () => macros.filter((m) => m.owner_user_id !== userId && m.is_shared),
    [macros, userId],
  );

  return {
    macros,
    mine,
    shared,
    isLoading,
    userId,
    createMacro,
    updateMacro,
    deleteMacro,
    duplicateMacro,
    reorder,
    seedDefaults,
  };
}
