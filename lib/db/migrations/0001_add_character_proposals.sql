CREATE TYPE "public"."campaign_role" AS ENUM('gm', 'player');--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "campaign_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "campaign_role" DEFAULT 'player' NOT NULL,
	"character_id" uuid,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'chat' NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"is_gm_only" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"notes" text,
	"session_number" text DEFAULT '1',
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"system" text DEFAULT 'Aetheria',
	"is_active" boolean DEFAULT true,
	"invite_code" text,
	"image_url" text,
	"discord_link" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"character_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tabletop_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"tokens" text DEFAULT '[]' NOT NULL,
	"drawings" text DEFAULT '[]' NOT NULL,
	"map_image_url" text,
	"fog_visible" boolean DEFAULT false NOT NULL,
	"zoom" text DEFAULT '1',
	"pan_offset" text DEFAULT '{"x":0,"y":0}',
	"updated_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tabletop_state_campaign_id_unique" UNIQUE("campaign_id")
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"race" text DEFAULT 'Humain' NOT NULL,
	"class" text DEFAULT 'Guerrier' NOT NULL,
	"subclass" text,
	"level" integer DEFAULT 1 NOT NULL,
	"background" text,
	"alignment" text,
	"campaign" text,
	"strength" integer DEFAULT 10 NOT NULL,
	"dexterity" integer DEFAULT 10 NOT NULL,
	"constitution" integer DEFAULT 10 NOT NULL,
	"intelligence" integer DEFAULT 10 NOT NULL,
	"wisdom" integer DEFAULT 10 NOT NULL,
	"charisma" integer DEFAULT 10 NOT NULL,
	"hp" integer DEFAULT 10 NOT NULL,
	"max_hp" integer DEFAULT 10 NOT NULL,
	"temp_hp" integer DEFAULT 0,
	"armor_class" integer DEFAULT 10 NOT NULL,
	"initiative" integer DEFAULT 0,
	"speed" integer DEFAULT 30,
	"proficiency_bonus" integer DEFAULT 2,
	"experience_points" integer DEFAULT 0,
	"gold" integer DEFAULT 0,
	"hit_dice" text,
	"saving_throws" text,
	"skills" text,
	"languages" text,
	"equipped_weapon_id" text,
	"equipped_armor_id" text,
	"equipped_items" text,
	"inventory" text,
	"known_spells" text,
	"prepared_spells" text,
	"spell_slots" text,
	"spellcasting_ability" text,
	"spell_attack_bonus" integer,
	"spell_save_dc" integer,
	"personality_traits" text,
	"ideals" text,
	"bonds" text,
	"flaws" text,
	"backstory" text,
	"appearance" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aetheria_creatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" text NOT NULL,
	"campaign_id" uuid,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"lore" text,
	"size" text DEFAULT 'Moyen' NOT NULL,
	"force" integer DEFAULT 10 NOT NULL,
	"agilite" integer DEFAULT 10 NOT NULL,
	"endurance" integer DEFAULT 10 NOT NULL,
	"esprit" integer DEFAULT 10 NOT NULL,
	"pv" integer DEFAULT 10 NOT NULL,
	"pv_max" integer DEFAULT 10 NOT NULL,
	"pe" integer DEFAULT 0 NOT NULL,
	"pe_max" integer DEFAULT 0 NOT NULL,
	"def_physique" integer DEFAULT 10 NOT NULL,
	"def_magique" integer DEFAULT 10 NOT NULL,
	"reduction_physique" integer DEFAULT 0 NOT NULL,
	"reduction_magique" integer DEFAULT 0 NOT NULL,
	"initiative_bonus" integer DEFAULT 0 NOT NULL,
	"attaque" text,
	"degats" text,
	"capacites" text DEFAULT '[]' NOT NULL,
	"conditions_immunites" text DEFAULT '[]' NOT NULL,
	"image_url" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" text,
	"name" text NOT NULL,
	"type" text DEFAULT 'Objet merveilleux' NOT NULL,
	"rarity" text DEFAULT 'Commun' NOT NULL,
	"attunement" boolean DEFAULT false NOT NULL,
	"description" text NOT NULL,
	"properties" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monsters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" text,
	"name" text NOT NULL,
	"type" text DEFAULT 'Bête' NOT NULL,
	"size" text DEFAULT 'Moyen' NOT NULL,
	"alignment" text DEFAULT 'Neutre' NOT NULL,
	"armor_class" integer DEFAULT 10 NOT NULL,
	"hit_points" text DEFAULT '10' NOT NULL,
	"speed" text DEFAULT '9 m' NOT NULL,
	"challenge_rating" text DEFAULT '1/4' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spells" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" text,
	"name" text NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"school" text DEFAULT 'Evocation' NOT NULL,
	"casting_time" text DEFAULT '1 action' NOT NULL,
	"range" text DEFAULT 'Personnelle' NOT NULL,
	"components" text DEFAULT 'V' NOT NULL,
	"duration" text DEFAULT 'Instantanée' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"classes" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wa_creatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" text,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"profile" text DEFAULT '' NOT NULL,
	"power_level" text DEFAULT '' NOT NULL,
	"size" text DEFAULT 'Moyen' NOT NULL,
	"strength" integer DEFAULT 10 NOT NULL,
	"dexterity" integer DEFAULT 10 NOT NULL,
	"constitution" integer DEFAULT 10 NOT NULL,
	"intelligence" integer DEFAULT 10 NOT NULL,
	"wisdom" integer DEFAULT 10 NOT NULL,
	"charisma" integer DEFAULT 10 NOT NULL,
	"ra" text DEFAULT '' NOT NULL,
	"image_url" text,
	"author" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "combat_encounters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"name" text DEFAULT 'Rencontre' NOT NULL,
	"round" integer DEFAULT 1 NOT NULL,
	"current_turn" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "combat_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"encounter_id" uuid NOT NULL,
	"name" text NOT NULL,
	"initiative" integer DEFAULT 0 NOT NULL,
	"current_hp" integer DEFAULT 10 NOT NULL,
	"max_hp" integer DEFAULT 10 NOT NULL,
	"armor_class" integer DEFAULT 10 NOT NULL,
	"is_player" boolean DEFAULT true NOT NULL,
	"character_id" uuid,
	"monster_id" uuid,
	"conditions" text,
	"notes" text,
	"turn_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_messages" ADD CONSTRAINT "campaign_messages_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_notes" ADD CONSTRAINT "campaign_notes_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_sessions" ADD CONSTRAINT "campaign_sessions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_proposals" ADD CONSTRAINT "character_proposals_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_proposals" ADD CONSTRAINT "character_proposals_member_id_campaign_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."campaign_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_proposals" ADD CONSTRAINT "character_proposals_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tabletop_state" ADD CONSTRAINT "tabletop_state_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combat_encounters" ADD CONSTRAINT "combat_encounters_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combat_participants" ADD CONSTRAINT "combat_participants_encounter_id_combat_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."combat_encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_proposals_campaign_id" ON "character_proposals" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_proposals_member_id" ON "character_proposals" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_proposals_status" ON "character_proposals" USING btree ("status");