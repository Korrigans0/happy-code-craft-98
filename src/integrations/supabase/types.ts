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
      spells: {
        Row: {
          casting_time: string
          classes: string[]
          components: string
          created_at: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
