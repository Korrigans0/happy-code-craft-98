import { pgTable, text, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const spellsTable = pgTable("spells", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: text("created_by"),
  name: text("name").notNull(),
  level: integer("level").default(0).notNull(),
  school: text("school").notNull().default("Evocation"),
  castingTime: text("casting_time").notNull().default("1 action"),
  range: text("range").notNull().default("Personnelle"),
  components: text("components").notNull().default("V"),
  duration: text("duration").notNull().default("Instantanée"),
  description: text("description").notNull().default(""),
  classes: text("classes").default("[]").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const monstersTable = pgTable("monsters", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: text("created_by"),
  name: text("name").notNull(),
  type: text("type").notNull().default("Bête"),
  size: text("size").notNull().default("Moyen"),
  alignment: text("alignment").notNull().default("Neutre"),
  armorClass: integer("armor_class").default(10).notNull(),
  hitPoints: text("hit_points").notNull().default("10"),
  speed: text("speed").notNull().default("9 m"),
  challengeRating: text("challenge_rating").notNull().default("1/4"),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const magicItemsTable = pgTable("magic_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: text("created_by"),
  name: text("name").notNull(),
  type: text("type").notNull().default("Objet merveilleux"),
  rarity: text("rarity").notNull().default("Commun"),
  attunement: boolean("attunement").default(false).notNull(),
  description: text("description").notNull(),
  properties: text("properties"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const waCreaturesTable = pgTable("wa_creatures", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: text("created_by"),
  name: text("name").notNull(),
  description: text("description").default("").notNull(),
  profile: text("profile").default("").notNull(),
  powerLevel: text("power_level").default("").notNull(),
  size: text("size").default("Moyen").notNull(),
  strength: integer("strength").default(10).notNull(),
  dexterity: integer("dexterity").default(10).notNull(),
  constitution: integer("constitution").default(10).notNull(),
  intelligence: integer("intelligence").default(10).notNull(),
  wisdom: integer("wisdom").default(10).notNull(),
  charisma: integer("charisma").default(10).notNull(),
  ra: text("ra").default("").notNull(),
  imageUrl: text("image_url"),
  author: text("author"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aetheriaCreaturesTable = pgTable("aetheria_creatures", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: text("created_by").notNull(),
  campaignId: uuid("campaign_id"),
  name: text("name").notNull(),
  description: text("description").default("").notNull(),
  lore: text("lore"),
  size: text("size").default("Moyen").notNull(),
  force: integer("force").default(10).notNull(),
  agilite: integer("agilite").default(10).notNull(),
  endurance: integer("endurance").default(10).notNull(),
  esprit: integer("esprit").default(10).notNull(),
  pv: integer("pv").default(10).notNull(),
  pvMax: integer("pv_max").default(10).notNull(),
  pe: integer("pe").default(0).notNull(),
  peMax: integer("pe_max").default(0).notNull(),
  defPhysique: integer("def_physique").default(10).notNull(),
  defMagique: integer("def_magique").default(10).notNull(),
  reductionPhysique: integer("reduction_physique").default(0).notNull(),
  reductionMagique: integer("reduction_magique").default(0).notNull(),
  initiativeBonus: integer("initiative_bonus").default(0).notNull(),
  attaque: text("attaque"),
  degats: text("degats"),
  capacites: text("capacites").default("[]").notNull(),
  conditionsImmunites: text("conditions_immunites").default("[]").notNull(),
  imageUrl: text("image_url"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Spell = typeof spellsTable.$inferSelect;
export type Monster = typeof monstersTable.$inferSelect;
export type MagicItem = typeof magicItemsTable.$inferSelect;
export type WaCreature = typeof waCreaturesTable.$inferSelect;
export type AetheriaCreature = typeof aetheriaCreaturesTable.$inferSelect;

export const insertSpellSchema = createInsertSchema(spellsTable).omit({ id: true, createdAt: true });
export const insertMonsterSchema = createInsertSchema(monstersTable).omit({ id: true, createdAt: true });
export const insertMagicItemSchema = createInsertSchema(magicItemsTable).omit({ id: true, createdAt: true });
export const insertWaCreatureSchema = createInsertSchema(waCreaturesTable).omit({ id: true, createdAt: true });
export const insertAetheriaCreatureSchema = createInsertSchema(aetheriaCreaturesTable).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertSpell = z.infer<typeof insertSpellSchema>;
export type InsertMonster = z.infer<typeof insertMonsterSchema>;
export type InsertMagicItem = z.infer<typeof insertMagicItemSchema>;
export type InsertWaCreature = z.infer<typeof insertWaCreatureSchema>;
export type InsertAetheriaCreature = z.infer<typeof insertAetheriaCreatureSchema>;
