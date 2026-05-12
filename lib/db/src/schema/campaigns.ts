import { pgTable, text, boolean, timestamp, uuid, pgEnum, index } from "drizzle-orm/pg-core";
import { charactersTable } from "./characters";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const campaignRoleEnum = pgEnum("campaign_role", ["gm", "player"]);

export const campaignsTable = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  system: text("system").default("Aetheria"),
  isActive: boolean("is_active").default(true),
  inviteCode: text("invite_code"),
  imageUrl: text("image_url"),
  discordLink: text("discord_link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaignMembersTable = pgTable("campaign_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => campaignsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  role: campaignRoleEnum("role").default("player").notNull(),
  characterId: uuid("character_id"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const campaignMessagesTable = pgTable("campaign_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => campaignsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").default("chat").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaignNotesTable = pgTable("campaign_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => campaignsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  isGmOnly: boolean("is_gm_only").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaignSessionsTable = pgTable("campaign_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => campaignsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  notes: text("notes"),
  sessionNumber: text("session_number").default("1"),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tabletopStateTable = pgTable("tabletop_state", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().unique().references(() => campaignsTable.id, { onDelete: "cascade" }),
  tokens: text("tokens").default("[]").notNull(),
  drawings: text("drawings").default("[]").notNull(),
  mapImageUrl: text("map_image_url"),
  fogVisible: boolean("fog_visible").default(false).notNull(),
  zoom: text("zoom").default("1"),
  panOffset: text("pan_offset").default('{"x":0,"y":0}'),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const characterProposalsTable = pgTable("character_proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => campaignsTable.id, { onDelete: "cascade" }),
  memberId: uuid("member_id").notNull().references(() => campaignMembersTable.id, { onDelete: "cascade" }),
  characterId: uuid("character_id").notNull().references(() => charactersTable.id, { onDelete: "cascade" }),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_proposals_campaign_id").on(t.campaignId),
  index("idx_proposals_member_id").on(t.memberId),
  index("idx_proposals_status").on(t.status),
]);

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaignsTable.$inferSelect;
export type CampaignMember = typeof campaignMembersTable.$inferSelect;
export type CampaignMessage = typeof campaignMessagesTable.$inferSelect;
export type CampaignNote = typeof campaignNotesTable.$inferSelect;
export type CampaignSession = typeof campaignSessionsTable.$inferSelect;
export type TabletopState = typeof tabletopStateTable.$inferSelect;
export type CharacterProposal = typeof characterProposalsTable.$inferSelect;
