export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aetheria_creatures: {
        Row: {
          agilite: number
          attaque: string | null
          campaign_id: string | null
          capacites: Json
          conditions_immunites: string[]
          created_at: string
          created_by: string
          def_magique: number
          def_physique: number
          degats: string | null
          description: string
          endurance: number
          esprit: number
          force: number
          id: string
          image_url: string | null
          initiative_bonus: number
          is_public: boolean
          lore: string | null
          name: string
          pe: number
          pe_max: number
          pv: number
          pv_max: number
          reduction_magique: number
          reduction_physique: number
          size: string
          updated_at: string
        }
        Insert: {
          agilite?: number
          attaque?: string | null
          campaign_id?: string | null
          capacites?: Json
          conditions_immunites?: string[]
          created_at?: string
          created_by: string
          def_magique?: number
          def_physique?: number
          degats?: string | null
          description?: string
          endurance?: number
          esprit?: number
          force?: number
          id?: string
          image_url?: string | null
          initiative_bonus?: number
          is_public?: boolean
          lore?: string | null
          name: string
          pe?: number
          pe_max?: number
          pv?: number
          pv_max?: number
          reduction_magique?: number
          reduction_physique?: number
          size?: string
          updated_at?: string
        }
        Update: {
          agilite?: number
          attaque?: string | null
          campaign_id?: string | null
          capacites?: Json
          conditions_immunites?: string[]
          created_at?: string
          created_by?: string
          def_magique?: number
          def_physique?: number
          degats?: string | null
          description?: string
          endurance?: number
          esprit?: number
          force?: number
          id?: string
          image_url?: string | null
          initiative_bonus?: number
          is_public?: boolean
          lore?: string | null
          name?: string
          pe?: number
          pe_max?: number
          pv?: number
          pv_max?: number
          reduction_magique?: number
          reduction_physique?: number
          size?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aetheria_creatures_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_audit_log: {
        Row: {
          action: string
          campaign_id: string
          created_at: string
          details: Json
          id: string
          scope: string | null
          user_id: string
        }
        Insert: {
          action: string
          campaign_id: string
          created_at?: string
          details?: Json
          id?: string
          scope?: string | null
          user_id: string
        }
        Update: {
          action?: string
          campaign_id?: string
          created_at?: string
          details?: Json
          id?: string
          scope?: string | null
          user_id?: string
        }
        Relationships: []
      }
      campaign_members: {
        Row: {
          campaign_id: string
          character_id: string | null
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["campaign_role"]
          user_id: string
        }
        Insert: {
          campaign_id: string
          character_id?: string | null
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["campaign_role"]
          user_id: string
        }
        Update: {
          campaign_id?: string
          character_id?: string | null
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["campaign_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_members_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_messages: {
        Row: {
          campaign_id: string
          content: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          content: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_notes: {
        Row: {
          campaign_id: string
          content: string | null
          created_at: string
          id: string
          is_gm_only: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          content?: string | null
          created_at?: string
          id?: string
          is_gm_only?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          content?: string | null
          created_at?: string
          id?: string
          is_gm_only?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_notes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_sessions: {
        Row: {
          campaign_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          scheduled_at: string | null
          session_number: number
          title: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          scheduled_at?: string | null
          session_number?: number
          title: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          scheduled_at?: string | null
          session_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_sessions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          description: string | null
          discord_link: string | null
          id: string
          image_url: string | null
          invite_code: string | null
          is_active: boolean | null
          system: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discord_link?: string | null
          id?: string
          image_url?: string | null
          invite_code?: string | null
          is_active?: boolean | null
          system?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discord_link?: string | null
          id?: string
          image_url?: string | null
          invite_code?: string | null
          is_active?: boolean | null
          system?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      characters: {
        Row: {
          alignment: string | null
          appearance: string | null
          armor_class: number
          avatar_url: string | null
          background: string | null
          backstory: string | null
          bonds: string | null
          campaign: string | null
          charisma: number
          class: string
          constitution: number
          created_at: string
          dexterity: number
          equipped_armor_id: string | null
          equipped_items: string[] | null
          equipped_weapon_id: string | null
          experience_points: number | null
          flaws: string | null
          gold: number | null
          hit_dice: string | null
          hp: number
          id: string
          ideals: string | null
          initiative: number | null
          intelligence: number
          inventory: string | null
          known_spells: string[] | null
          languages: string[] | null
          level: number
          max_hp: number
          name: string
          personality_traits: string | null
          prepared_spells: string[] | null
          proficiency_bonus: number | null
          race: string
          saving_throws: string[] | null
          skills: string[] | null
          speed: number | null
          spell_attack_bonus: number | null
          spell_save_dc: number | null
          spell_slots: Json | null
          spellcasting_ability: string | null
          strength: number
          subclass: string | null
          system: string
          system_data: Json
          temp_hp: number | null
          updated_at: string
          user_id: string | null
          wisdom: number
        }
        Insert: {
          alignment?: string | null
          appearance?: string | null
          armor_class?: number
          avatar_url?: string | null
          background?: string | null
          backstory?: string | null
          bonds?: string | null
          campaign?: string | null
          charisma?: number
          class: string
          constitution?: number
          created_at?: string
          dexterity?: number
          equipped_armor_id?: string | null
          equipped_items?: string[] | null
          equipped_weapon_id?: string | null
          experience_points?: number | null
          flaws?: string | null
          gold?: number | null
          hit_dice?: string | null
          hp?: number
          id?: string
          ideals?: string | null
          initiative?: number | null
          intelligence?: number
          inventory?: string | null
          known_spells?: string[] | null
          languages?: string[] | null
          level?: number
          max_hp?: number
          name: string
          personality_traits?: string | null
          prepared_spells?: string[] | null
          proficiency_bonus?: number | null
          race: string
          saving_throws?: string[] | null
          skills?: string[] | null
          speed?: number | null
          spell_attack_bonus?: number | null
          spell_save_dc?: number | null
          spell_slots?: Json | null
          spellcasting_ability?: string | null
          strength?: number
          subclass?: string | null
          system?: string
          system_data?: Json
          temp_hp?: number | null
          updated_at?: string
          user_id?: string | null
          wisdom?: number
        }
        Update: {
          alignment?: string | null
          appearance?: string | null
          armor_class?: number
          avatar_url?: string | null
          background?: string | null
          backstory?: string | null
          bonds?: string | null
          campaign?: string | null
          charisma?: number
          class?: string
          constitution?: number
          created_at?: string
          dexterity?: number
          equipped_armor_id?: string | null
          equipped_items?: string[] | null
          equipped_weapon_id?: string | null
          experience_points?: number | null
          flaws?: string | null
          gold?: number | null
          hit_dice?: string | null
          hp?: number
          id?: string
          ideals?: string | null
          initiative?: number | null
          intelligence?: number
          inventory?: string | null
          known_spells?: string[] | null
          languages?: string[] | null
          level?: number
          max_hp?: number
          name?: string
          personality_traits?: string | null
          prepared_spells?: string[] | null
          proficiency_bonus?: number | null
          race?: string
          saving_throws?: string[] | null
          skills?: string[] | null
          speed?: number | null
          spell_attack_bonus?: number | null
          spell_save_dc?: number | null
          spell_slots?: Json | null
          spellcasting_ability?: string | null
          strength?: number
          subclass?: string | null
          system?: string
          system_data?: Json
          temp_hp?: number | null
          updated_at?: string
          user_id?: string | null
          wisdom?: number
        }
        Relationships: [
          {
            foreignKeyName: "characters_equipped_armor_id_fkey"
            columns: ["equipped_armor_id"]
            isOneToOne: false
            referencedRelation: "magic_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_equipped_weapon_id_fkey"
            columns: ["equipped_weapon_id"]
            isOneToOne: false
            referencedRelation: "magic_items"
            referencedColumns: ["id"]
          },
        ]
      }
      combat_encounters: {
        Row: {
          campaign_id: string
          created_at: string
          current_turn: number
          id: string
          is_active: boolean
          name: string
          round: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          current_turn?: number
          id?: string
          is_active?: boolean
          name?: string
          round?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          current_turn?: number
          id?: string
          is_active?: boolean
          name?: string
          round?: number
        }
        Relationships: [
          {
            foreignKeyName: "combat_encounters_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      combat_participants: {
        Row: {
          armor_class: number
          character_id: string | null
          conditions: string[] | null
          current_hp: number
          encounter_id: string
          id: string
          initiative: number
          is_player: boolean
          max_hp: number
          monster_id: string | null
          name: string
          notes: string | null
          turn_order: number
        }
        Insert: {
          armor_class?: number
          character_id?: string | null
          conditions?: string[] | null
          current_hp?: number
          encounter_id: string
          id?: string
          initiative?: number
          is_player?: boolean
          max_hp?: number
          monster_id?: string | null
          name: string
          notes?: string | null
          turn_order?: number
        }
        Update: {
          armor_class?: number
          character_id?: string | null
          conditions?: string[] | null
          current_hp?: number
          encounter_id?: string
          id?: string
          initiative?: number
          is_player?: boolean
          max_hp?: number
          monster_id?: string | null
          name?: string
          notes?: string | null
          turn_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "combat_participants_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combat_participants_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "combat_encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combat_participants_monster_id_fkey"
            columns: ["monster_id"]
            isOneToOne: false
            referencedRelation: "monsters"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      magic_items: {
        Row: {
          attunement: boolean
          created_at: string
          created_by: string | null
          description: string
          id: string
          name: string
          properties: string | null
          rarity: string
          type: string
        }
        Insert: {
          attunement?: boolean
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          name: string
          properties?: string | null
          rarity: string
          type: string
        }
        Update: {
          attunement?: boolean
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          name?: string
          properties?: string | null
          rarity?: string
          type?: string
        }
        Relationships: []
      }
      monsters: {
        Row: {
          alignment: string
          armor_class: number
          challenge_rating: string
          created_at: string
          created_by: string | null
          description: string
          hit_points: string
          id: string
          name: string
          size: string
          speed: string
          type: string
        }
        Insert: {
          alignment: string
          armor_class: number
          challenge_rating: string
          created_at?: string
          created_by?: string | null
          description: string
          hit_points: string
          id?: string
          name: string
          size: string
          speed: string
          type: string
        }
        Update: {
          alignment?: string
          armor_class?: number
          challenge_rating?: string
          created_at?: string
          created_by?: string | null
          description?: string
          hit_points?: string
          id?: string
          name?: string
          size?: string
          speed?: string
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spells: {
        Row: {
          casting_time: string
          classes: string[]
          components: string
          created_at: string
          created_by: string | null
          description: string
          duration: string
          id: string
          level: number
          name: string
          range: string
          school: string
        }
        Insert: {
          casting_time: string
          classes?: string[]
          components: string
          created_at?: string
          created_by?: string | null
          description: string
          duration: string
          id?: string
          level?: number
          name: string
          range: string
          school: string
        }
        Update: {
          casting_time?: string
          classes?: string[]
          components?: string
          created_at?: string
          created_by?: string | null
          description?: string
          duration?: string
          id?: string
          level?: number
          name?: string
          range?: string
          school?: string
        }
        Relationships: []
      }
      tabletop_state: {
        Row: {
          campaign_id: string
          drawings: Json
          fog_visible: boolean
          id: string
          lights: Json
          map_image_url: string | null
          night_mode: boolean
          pan_offset: Json
          tokens: Json
          updated_at: string
          updated_by: string | null
          walls: Json
          zoom: number
        }
        Insert: {
          campaign_id: string
          drawings?: Json
          fog_visible?: boolean
          id?: string
          lights?: Json
          map_image_url?: string | null
          night_mode?: boolean
          pan_offset?: Json
          tokens?: Json
          updated_at?: string
          updated_by?: string | null
          walls?: Json
          zoom?: number
        }
        Update: {
          campaign_id?: string
          drawings?: Json
          fog_visible?: boolean
          id?: string
          lights?: Json
          map_image_url?: string | null
          night_mode?: boolean
          pan_offset?: Json
          tokens?: Json
          updated_at?: string
          updated_by?: string | null
          walls?: Json
          zoom?: number
        }
        Relationships: [
          {
            foreignKeyName: "tabletop_state_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      tabletop_token_notes: {
        Row: {
          campaign_id: string
          content: string
          created_at: string
          created_by: string
          id: string
          token_id: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          content?: string
          created_at?: string
          created_by: string
          id?: string
          token_id: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          token_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wa_creatures: {
        Row: {
          author: string | null
          charisma: number
          constitution: number
          created_at: string
          created_by: string | null
          description: string
          dexterity: number
          id: string
          image_url: string | null
          intelligence: number
          name: string
          power_level: string
          profile: string
          ra: string
          size: string
          strength: number
          wisdom: number
        }
        Insert: {
          author?: string | null
          charisma?: number
          constitution?: number
          created_at?: string
          created_by?: string | null
          description?: string
          dexterity?: number
          id?: string
          image_url?: string | null
          intelligence?: number
          name: string
          power_level?: string
          profile?: string
          ra?: string
          size?: string
          strength?: number
          wisdom?: number
        }
        Update: {
          author?: string | null
          charisma?: number
          constitution?: number
          created_at?: string
          created_by?: string | null
          description?: string
          dexterity?: number
          id?: string
          image_url?: string | null
          intelligence?: number
          name?: string
          power_level?: string
          profile?: string
          ra?: string
          size?: string
          strength?: number
          wisdom?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_campaign_access: {
        Args: { _campaign_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_campaign_gm: {
        Args: { _campaign_id: string; _user_id: string }
        Returns: boolean
      }
      is_campaign_member: {
        Args: { _campaign_id: string; _user_id: string }
        Returns: boolean
      }
      join_campaign_by_invite_code: { Args: { _code: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      campaign_role: "gm" | "player"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      campaign_role: ["gm", "player"],
    },
  },
} as const
