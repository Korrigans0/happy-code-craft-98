const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Scraping Worlds Awakening bestiary index...');
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.worlds-awakening.com/fr/bestiaire',
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error('Firecrawl scrape error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: `Scrape failed: ${scrapeData.error || scrapeResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown: string = scrapeData.data?.markdown || scrapeData.markdown || '';
    console.log(`Scraped ${markdown.length} chars of markdown`);

    const creatures = parseWACreatures(markdown);
    console.log(`Parsed ${creatures.length} creatures`);

    if (creatures.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Aucune créature trouvée', parsed: 0, debug: markdown.substring(0, 500) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (const creature of creatures) {
      const { data: existing } = await supabase
        .from('wa_creatures')
        .select('id')
        .eq('name', creature.name)
        .is('created_by', null)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('wa_creatures')
          .update(creature)
          .eq('id', existing.id);
        if (error) { errors++; console.error('Update err', creature.name, error.message); }
        else updated++;
      } else {
        const { error } = await supabase
          .from('wa_creatures')
          .insert(creature);
        if (error) { errors++; console.error('Insert err', creature.name, error.message); }
        else inserted++;
      }
    }

    console.log(`Sync complete: ${inserted} inserted, ${updated} updated, ${errors} errors`);

    return new Response(
      JSON.stringify({ success: true, inserted, updated, errors, total: creatures.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error syncing WA bestiary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface ParsedCreature {
  name: string;
  size: string;
  power_level: string;
  profile: string;
  ra: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  description: string;
  author: string;
  image_url?: string | null;
}

/**
 * Parse the WA bestiary index markdown.
 * Each creature block follows this pattern:
 *
 *   [![](https://.../field_image/.../xxx.png.webp?...)](https://.../user/NN/bestiary/ID)
 *   [Nom Créature](https://.../user/NN/bestiary/ID)
 *   Puissance - Taille - Profil
 *   [Imprimer](.../wa/creature/ID/print)
 *   **RA:** X/Y
 *   **FOR** +N ... etc
 *   Publié par [Auteur](...)
 */
function parseWACreatures(markdown: string): ParsedCreature[] {
  const creatures: ParsedCreature[] = [];

  // Regex capturing each creature block by anchoring on the "Imprimer" line + RA + 6 stats
  const blockRegex = /\[([^\]\n]+?)\]\(https:\/\/www\.worlds-awakening\.com\/[^)]*?\/bestiary\/(\d+)\)\s*\n+\s*([^\n]+?)\s*\n[\s\S]*?\*\*RA:\*\*\s*([^\n]+)\n+[\s\S]*?\*\*FOR\*\*\s*([+-]?\d+)\n+[\s\S]*?\*\*DEX\*\*\s*([+-]?\d+)\n+[\s\S]*?\*\*CON\*\*\s*([+-]?\d+)\n+[\s\S]*?\*\*INT\*\*\s*([+-]?\d+)\n+[\s\S]*?\*\*SAG\*\*\s*([+-]?\d+)\n+[\s\S]*?\*\*CHA\*\*\s*([+-]?\d+)[\s\S]*?Publié par\s*\[([^\]]+)\]/g;

  // Build a quick lookup of creature ID -> image URL by scanning image lines
  const imageMap = new Map<string, string>();
  const imgRegex = /\[!\[\]\((https:\/\/[^)]+\.webp[^)]*)\)\]\(https:\/\/www\.worlds-awakening\.com\/[^)]*?\/bestiary\/(\d+)\)/g;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(markdown)) !== null) {
    imageMap.set(imgMatch[2], imgMatch[1]);
  }

  let m;
  const seen = new Set<string>();
  while ((m = blockRegex.exec(markdown)) !== null) {
    const [, rawName, id, meta, ra, forStr, dexStr, conStr, intStr, sagStr, chaStr, author] = m;
    const name = rawName.trim();
    if (seen.has(name)) continue;
    seen.add(name);

    // meta = "Puissance - Taille - Profil"
    const parts = meta.split(/\s+-\s+/).map(s => s.trim());
    const power_level = parts[0] || 'Standard';
    const size = parts[1] || 'Moyen';
    const profile = parts[2] || 'Équilibré';

    creatures.push({
      name,
      size,
      power_level,
      profile,
      ra: ra.trim(),
      strength: parseInt(forStr) || 0,
      dexterity: parseInt(dexStr) || 0,
      constitution: parseInt(conStr) || 0,
      intelligence: parseInt(intStr) || 0,
      wisdom: parseInt(sagStr) || 0,
      charisma: parseInt(chaStr) || 0,
      description: `${name} — ${power_level}, ${size}, profil ${profile}. Créature officielle du bestiaire communautaire Worlds Awakening.`,
      author: author.trim(),
      image_url: imageMap.get(id) || null,
    });
  }

  return creatures;
}
