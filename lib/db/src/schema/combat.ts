import { pgTable, text, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { campaignsTable } from "./campaigns";

export const combatEncountersTable = pgTable("combat_encounters", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => campaignsTable.id, { onDelete: "cascade" }),
  name: text("name").default("Rencontre").notNull(),
  round: integer("round").default(1).notNull(),
  currentTurn: integer("current_turn").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const combatParticipantsTable = pgTable("combat_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  encounterId: uuid("encounter_id").notNull().references(() => combatEncountersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  initiative: integer("initiative").default(0).notNull(),
  currentHp: integer("current_hp").default(10).notNull(),
  maxHp: integer("max_hp").default(10).notNull(),
  armorClass: integer("armor_class").default(10).notNull(),
  isPlayer: boolean("is_player").default(true).notNull(),
  characterId: uuid("character_id"),
  monsterId: uuid("monster_id"),
  conditions: text("conditions"),
  notes: text("notes"),
  turnOrder: integer("turn_order").default(0).notNull(),
});

export type CombatEncounter = typeof combatEncountersTable.$inferSelect;
export type CombatParticipant = typeof combatParticipantsTable.$inferSelect;

export const insertCombatParticipantSchema = createInsertSchema(combatParticipantsTable).omit({ id: true });
export type InsertCombatParticipant = z.infer<typeof insertCombatParticipantSchema>;
