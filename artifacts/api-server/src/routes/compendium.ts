import { Router } from "express";
import { db } from "@workspace/db";
import { spellsTable, monstersTable, magicItemsTable, waCreaturesTable, aetheriaCreaturesTable } from "@workspace/db";
import { asc, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { scrapeWaBestiary } from "../lib/wa-scraper.js";

const router = Router();

// SPELLS
router.get("/spells", async (req, res) => {
  const spells = await db.select().from(spellsTable).orderBy(asc(spellsTable.name));
  res.json(spells);
});
router.post("/spells", requireAuth, async (req, res) => {
  const userId = req.userId! as string;
  const body = req.body;
  const [spell] = await db.insert(spellsTable).values({
    createdBy: userId,
    name: body.name, level: body.level || 0, school: body.school || "Evocation",
    castingTime: body.casting_time || "1 action", range: body.range || "Personnelle",
    components: body.components || "V", duration: body.duration || "Instantanée",
    description: body.description || "",
    classes: Array.isArray(body.classes) ? JSON.stringify(body.classes) : (body.classes || "[]"),
  }).returning();
  res.status(201).json(spell);
});

// MONSTERS
router.get("/monsters", async (req, res) => {
  const monsters = await db.select().from(monstersTable).orderBy(asc(monstersTable.name));
  res.json(monsters);
});
router.post("/monsters", requireAuth, async (req, res) => {
  const userId = req.userId! as string;
  const body = req.body;
  const [monster] = await db.insert(monstersTable).values({
    createdBy: userId,
    name: body.name, type: body.type || "Bête", size: body.size || "Moyen",
    alignment: body.alignment || "Neutre", armorClass: body.armor_class || 10,
    hitPoints: body.hit_points || "10", speed: body.speed || "9 m",
    challengeRating: body.challenge_rating || "1/4", description: body.description || "",
  }).returning();
  res.status(201).json(monster);
});

// MAGIC ITEMS
router.get("/items", async (req, res) => {
  const items = await db.select().from(magicItemsTable).orderBy(asc(magicItemsTable.name));
  res.json(items);
});
router.post("/items", requireAuth, async (req, res) => {
  const userId = req.userId! as string;
  const body = req.body;
  const [item] = await db.insert(magicItemsTable).values({
    createdBy: userId,
    name: body.name, type: body.type || "Objet merveilleux",
    rarity: body.rarity || "Commun", attunement: body.attunement || false,
    description: body.description, properties: body.properties,
  }).returning();
  res.status(201).json(item);
});

// WA CREATURES — live scrape from worlds-awakening.com/fr/bestiaire
router.post("/wa-creatures/sync", requireAuth, async (req, res) => {
  const logs: string[] = [];
  try {
    const scraped = await scrapeWaBestiary((msg) => { logs.push(msg); });
    if (scraped.length === 0) {
      res.json({ inserted: 0, updated: 0, total: 0, message: "Aucune créature récupérée.", logs }); return;
    }
    const existing = await db.select({ name: waCreaturesTable.name }).from(waCreaturesTable);
    const existingNames = new Set(existing.map(c => c.name));
    const toInsert = scraped.filter(c => !existingNames.has(c.name));
    let inserted = 0;
    if (toInsert.length > 0) {
      const rows = await db.insert(waCreaturesTable).values(
        toInsert.map(c => ({
          name: c.name, description: "", profile: c.profile,
          powerLevel: c.power_level, size: c.size,
          strength: c.strength, dexterity: c.dexterity, constitution: c.constitution,
          intelligence: c.intelligence, wisdom: c.wisdom, charisma: c.charisma,
          ra: c.ra, imageUrl: c.image_url || null, author: c.author, createdBy: null,
        }))
      ).returning();
      inserted = rows.length;
    }
    res.json({
      inserted,
      total: scraped.length,
      message: toInsert.length === 0
        ? `Bestiaire déjà à jour (${scraped.length} créatures au total).`
        : `${inserted} nouvelle(s) créature(s) ajoutée(s) sur ${scraped.length} récupérées.`,
      logs,
    });
  } catch (err: any) {
    logs.push(`Erreur : ${err?.message || err}`);
    res.status(500).json({ error: "Échec de la synchronisation.", detail: err?.message, logs });
  }
});

router.get("/wa-creatures", async (req, res) => {
  const creatures = await db.select().from(waCreaturesTable).orderBy(asc(waCreaturesTable.name));
  res.json(creatures);
});
router.post("/wa-creatures", requireAuth, async (req, res) => {
  const userId = req.userId! as string;
  const body = req.body;
  const [creature] = await db.insert(waCreaturesTable).values({
    createdBy: userId,
    name: body.name, description: body.description || "",
    profile: body.profile || "", powerLevel: body.power_level || "",
    size: body.size || "Moyen", strength: body.strength || 10,
    dexterity: body.dexterity || 10, constitution: body.constitution || 10,
    intelligence: body.intelligence || 10, wisdom: body.wisdom || 10,
    charisma: body.charisma || 10, ra: body.ra || "",
    imageUrl: body.image_url, author: body.author,
  }).returning();
  res.status(201).json(creature);
});

function serializeAetheriaCreature(c: any) {
  const parseJson = (v: any) => { try { return v ? JSON.parse(v) : []; } catch { return v ?? []; } };
  return {
    id: c.id, created_by: c.createdBy, campaign_id: c.campaignId,
    name: c.name, description: c.description, lore: c.lore, size: c.size,
    force: c.force, agilite: c.agilite, endurance: c.endurance, esprit: c.esprit,
    pv: c.pv, pv_max: c.pvMax, pe: c.pe, pe_max: c.peMax,
    def_physique: c.defPhysique, def_magique: c.defMagique,
    reduction_physique: c.reductionPhysique, reduction_magique: c.reductionMagique,
    initiative_bonus: c.initiativeBonus, attaque: c.attaque, degats: c.degats,
    capacites: parseJson(c.capacites),
    conditions_immunites: parseJson(c.conditionsImmunites),
    image_url: c.imageUrl, is_public: c.isPublic,
    created_at: c.createdAt, updated_at: c.updatedAt,
  };
}

// AETHERIA CREATURES
router.get("/aetheria-creatures", async (req, res) => {
  const { getAuth: clerkGetAuth } = await import("@clerk/express");
  const auth = clerkGetAuth(req);
  const userId = auth?.userId;
  const creatures = await db.select().from(aetheriaCreaturesTable).orderBy(asc(aetheriaCreaturesTable.name));
  const filtered = userId
    ? creatures.filter(c => c.isPublic || c.createdBy === userId)
    : creatures.filter(c => c.isPublic);
  res.json(filtered.map(serializeAetheriaCreature));
});
router.post("/aetheria-creatures", requireAuth, async (req, res) => {
  const userId = req.userId! as string;
  const body = req.body;
  const [creature] = await db.insert(aetheriaCreaturesTable).values({
    createdBy: userId,
    campaignId: body.campaign_id || null,
    name: body.name, description: body.description || "", lore: body.lore,
    size: body.size || "Moyen", force: body.force || 10, agilite: body.agilite || 10,
    endurance: body.endurance || 10, esprit: body.esprit || 10,
    pv: body.pv || 10, pvMax: body.pv_max || 10, pe: body.pe || 0, peMax: body.pe_max || 0,
    defPhysique: body.def_physique || 10, defMagique: body.def_magique || 10,
    reductionPhysique: body.reduction_physique || 0, reductionMagique: body.reduction_magique || 0,
    initiativeBonus: body.initiative_bonus || 0, attaque: body.attaque, degats: body.degats,
    capacites: Array.isArray(body.capacites) ? JSON.stringify(body.capacites) : (body.capacites || "[]"),
    conditionsImmunites: Array.isArray(body.conditions_immunites) ? JSON.stringify(body.conditions_immunites) : (body.conditions_immunites || "[]"),
    imageUrl: body.image_url, isPublic: body.is_public || false,
  }).returning();
  res.status(201).json(serializeAetheriaCreature(creature));
});

export default router;
