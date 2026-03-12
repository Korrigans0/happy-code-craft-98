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

    // Scrape the WA bestiary page
    console.log('Scraping Worlds Awakening bestiary...');
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

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    console.log(`Scraped ${markdown.length} chars of markdown`);

    // Parse creatures from markdown
    // WA bestiary pages typically list creatures with stats
    const creatures = parseWACreatures(markdown);
    console.log(`Parsed ${creatures.length} creatures`);

    if (creatures.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No new creatures found in scraped data', parsed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert creatures (match by name to avoid duplicates)
    let inserted = 0;
    let updated = 0;

    for (const creature of creatures) {
      // Check if creature already exists (official ones have created_by = null)
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
        if (!error) updated++;
      } else {
        const { error } = await supabase
          .from('wa_creatures')
          .insert(creature);
        if (!error) inserted++;
      }
    }

    console.log(`Sync complete: ${inserted} inserted, ${updated} updated`);

    return new Response(
      JSON.stringify({ success: true, inserted, updated, total: creatures.length }),
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
}

function parseWACreatures(markdown: string): ParsedCreature[] {
  const creatures: ParsedCreature[] = [];

  // Try to find creature entries in the markdown
  // WA bestiary format can vary, we try multiple patterns
  
  // Pattern 1: Heading-based sections (## Creature Name)
  const sections = markdown.split(/^#{1,3}\s+/m).filter(s => s.trim());

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const name = lines[0]?.trim();
    
    if (!name || name.length < 2 || name.length > 100) continue;
    // Skip non-creature headings
    if (/bestiaire|accueil|menu|navigation|filtres?|recherche/i.test(name)) continue;

    const text = lines.slice(1).join('\n');
    
    // Try to extract stats
    const creature: ParsedCreature = {
      name,
      size: extractField(text, /taille\s*[:：]\s*(\S+)/i) || 'Moyen',
      power_level: extractField(text, /puissance\s*[:：]\s*([^\n]+)/i) || 'Standard',
      profile: extractField(text, /profil\s*[:：]\s*([^\n]+)/i) || 'Équilibré',
      ra: extractField(text, /ra\s*[:：]\s*(\S+)/i) || '1/1',
      strength: extractStat(text, /for(?:ce)?\s*[:：]?\s*([+-]?\d+)/i),
      dexterity: extractStat(text, /dex(?:térité)?\s*[:：]?\s*([+-]?\d+)/i),
      constitution: extractStat(text, /con(?:stitution)?\s*[:：]?\s*([+-]?\d+)/i),
      intelligence: extractStat(text, /int(?:elligence)?\s*[:：]?\s*([+-]?\d+)/i),
      wisdom: extractStat(text, /sag(?:esse)?\s*[:：]?\s*([+-]?\d+)/i),
      charisma: extractStat(text, /cha(?:risme)?\s*[:：]?\s*([+-]?\d+)/i),
      description: text.substring(0, 500).trim() || `Créature de Worlds Awakening`,
      author: 'Worlds Awakening (auto-sync)',
    };

    // Only add if it looks like a creature (has at least a name)
    if (creature.name && creature.name !== '') {
      creatures.push(creature);
    }
  }

  return creatures;
}

function extractField(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  return match ? match[1].trim() : null;
}

function extractStat(text: string, pattern: RegExp): number {
  const match = text.match(pattern);
  return match ? parseInt(match[1]) : 0;
}
