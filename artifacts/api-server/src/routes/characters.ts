import { Router } from "express";
import { db } from "@workspace/db";
import { charactersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// GET /api/characters
router.get("/", requireAuth, async (req, res) => {
  const userId = req.userId! as string;
  const characters = await db.select().from(charactersTable)
    .where(eq(charactersTable.userId, userId))
    .orderBy(desc(charactersTable.createdAt));
  res.json(characters);
});

// POST /api/characters
router.post("/", requireAuth, async (req, res) => {
  const userId = req.userId! as string;
  const body = req.body;

  const [character] = await db.insert(charactersTable).values({
    userId,
    name: body.name,
    race: body.race || "Humain",
    class: body.class || body.classe || "Guerrier",
    subclass: body.subclass,
    level: body.level || 1,
    background: body.background,
    alignment: body.alignment,
    campaign: body.campaign,
    strength: body.strength || body.force || 10,
    dexterity: body.dexterity || body.agilite || 10,
    constitution: body.constitution || body.endurance || 10,
    intelligence: body.intelligence || body.esprit || 10,
    wisdom: body.wisdom || 10,
    charisma: body.charisma || 10,
    hp: body.hp || body.pv || 10,
    maxHp: body.max_hp || body.pv_max || body.hp || 10,
    armorClass: body.armor_class || 10,
    initiative: body.initiative || 0,
    speed: body.speed || 30,
    proficiencyBonus: body.proficiency_bonus || 2,
    experiencePoints: body.experience_points || 0,
    gold: body.gold || 0,
    hitDice: body.hit_dice,
    savingThrows: Array.isArray(body.saving_throws) ? JSON.stringify(body.saving_throws) : body.saving_throws,
    skills: Array.isArray(body.skills) ? JSON.stringify(body.skills) : body.skills,
    languages: Array.isArray(body.languages) ? JSON.stringify(body.languages) : body.languages,
    inventory: body.inventory,
    knownSpells: Array.isArray(body.known_spells) ? JSON.stringify(body.known_spells) : body.known_spells,
    preparedSpells: Array.isArray(body.prepared_spells) ? JSON.stringify(body.prepared_spells) : body.prepared_spells,
    spellSlots: body.spell_slots ? JSON.stringify(body.spell_slots) : null,
    spellcastingAbility: body.spellcasting_ability,
    spellAttackBonus: body.spell_attack_bonus,
    spellSaveDc: body.spell_save_dc,
    personality: body.personality_traits,
    ideals: body.ideals,
    bonds: body.bonds,
    flaws: body.flaws,
    backstory: body.backstory,
    appearance: body.appearance,
    avatarUrl: body.avatar_url,
  }).returning();

  res.status(201).json(character);
});

// GET /api/characters/:id  — owner only
router.get("/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = req.userId! as string;
  const [character] = await db.select().from(charactersTable)
    .where(and(eq(charactersTable.id, id), eq(charactersTable.userId, userId)));
  if (!character) { res.status(404).json({ error: "Not found" }); return; }
  res.json(character);
});

// PATCH /api/characters/:id
router.patch("/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = req.userId! as string;
  const body = req.body;

  const updates: Record<string, unknown> = {};
  const fieldMap: Record<string, string> = {
    name: "name", race: "race", class: "class", subclass: "subclass",
    level: "level", background: "background", alignment: "alignment",
    campaign: "campaign", strength: "strength", dexterity: "dexterity",
    constitution: "constitution", intelligence: "intelligence", wisdom: "wisdom",
    charisma: "charisma", hp: "hp", max_hp: "maxHp", temp_hp: "tempHp",
    armor_class: "armorClass", initiative: "initiative", speed: "speed",
    proficiency_bonus: "proficiencyBonus", experience_points: "experiencePoints",
    gold: "gold", hit_dice: "hitDice", inventory: "inventory",
    backstory: "backstory", appearance: "appearance", avatar_url: "avatarUrl",
    personality_traits: "personality", ideals: "ideals", bonds: "bonds", flaws: "flaws",
    spellcasting_ability: "spellcastingAbility", spell_attack_bonus: "spellAttackBonus",
    spell_save_dc: "spellSaveDc",
  };

  for (const [key, col] of Object.entries(fieldMap)) {
    if (body[key] !== undefined) updates[col] = body[key];
  }

  const arrayFields = ["saving_throws", "skills", "languages", "known_spells", "prepared_spells", "equipped_items"];
  for (const f of arrayFields) {
    if (body[f] !== undefined) {
      const col = f.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
      updates[col] = Array.isArray(body[f]) ? JSON.stringify(body[f]) : body[f];
    }
  }
  if (body.spell_slots !== undefined) updates.spellSlots = JSON.stringify(body.spell_slots);

  const [character] = await db.update(charactersTable).set(updates)
    .where(and(eq(charactersTable.id, id), eq(charactersTable.userId, userId)))
    .returning();
  if (!character) { res.status(404).json({ error: "Not found" }); return; }
  res.json(character);
});

// DELETE /api/characters/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = req.userId! as string;
  await db.delete(charactersTable).where(and(eq(charactersTable.id, id), eq(charactersTable.userId, userId)));
  res.json({ success: true });
});

export default router;
