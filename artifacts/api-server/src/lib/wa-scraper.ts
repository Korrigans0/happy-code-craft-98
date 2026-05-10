import { createRequire } from "module";
const require = createRequire(import.meta.url);

const CHROMIUM_PATHS = [
  "/nix/store/0n9rl5l9syy808xi9bk4f6dhnfrvhkww-playwright-browsers-chromium/chromium-1080/chrome-linux/chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "chromium",
];

async function getChromiumPath(): Promise<string> {
  const { access } = await import("fs/promises");
  for (const p of CHROMIUM_PATHS) {
    try { await access(p); return p; } catch {}
  }
  return "chromium";
}

export interface ScrapedWaCreature {
  name: string;
  power_level: string;
  size: string;
  profile: string;
  ra: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  author: string;
  image_url: string;
}

export async function scrapeWaBestiary(onProgress?: (msg: string) => void): Promise<ScrapedWaCreature[]> {
  const pw = require("playwright-core");
  const { chromium } = pw;

  const executablePath = await getChromiumPath();
  onProgress?.(`Lancement du navigateur (${executablePath})…`);

  const browser = await chromium.launch({
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    timeout: 30000,
  });

  const allCreatures: ScrapedWaCreature[] = [];

  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ "Accept-Language": "fr-FR,fr;q=0.9" });

    const extractCreatures = async (): Promise<ScrapedWaCreature[]> => {
      return (page as any).evaluate(
        /* This runs inside the browser — no Node.js types available */
        // eslint-disable-next-line no-new-func
        new Function(`
          const cards = [...document.querySelectorAll(".card.h-100")];
          return cards.map(el => {
            const titleEl = el.querySelector(".card-title .h5");
            const powerEl = el.querySelector(".power.text-muted");
            const raEl = el.querySelector(".ar span");
            const charEls = [...el.querySelectorAll(".characteristic")];
            const authorEl = el.querySelector(".col-10 small a");
            const imgEl = el.querySelector("img.card-img-top, .card-img img, img[src*='/creature/']");
            const chars = {};
            charEls.forEach(c => {
              const m = c.innerText.trim().match(/^(\\w+)\\s+([+-]?\\d+)$/);
              if (m) chars[m[1]] = parseInt(m[2]);
            });
            const parts = (powerEl?.innerText.trim() || "").split(" - ");
            return {
              name: titleEl?.innerText.trim() || "",
              power_level: parts[0]?.trim() || "",
              size: parts[1]?.trim() || "",
              profile: parts[2]?.trim() || "",
              ra: raEl?.innerText.trim() || "",
              strength: chars["FOR"] ?? 0,
              dexterity: chars["DEX"] ?? 0,
              constitution: chars["CON"] ?? 0,
              intelligence: chars["INT"] ?? 0,
              wisdom: chars["SAG"] ?? 0,
              charisma: chars["CHA"] ?? 0,
              author: authorEl?.innerText.trim() || "",
              image_url: imgEl?.src || "",
            };
          }).filter(c => c.name.length > 0);
        `)
      );
    };

    onProgress?.("Chargement de la page 1…");
    await page.goto("https://www.worlds-awakening.com/fr/bestiaire?page=0", {
      waitUntil: "load",
      timeout: 30000,
    });
    await page.waitForTimeout(5000);

    const firstPage = await extractCreatures();
    allCreatures.push(...firstPage);
    onProgress?.(`Page 1 : ${firstPage.length} créatures récupérées.`);

    const totalPages = await (page as any).evaluate(
      new Function(`
        const items = [...document.querySelectorAll(".pager__item a")];
        const nums = items.map(a => {
          const m = a.href.match(/page=(\\d+)/);
          return m ? parseInt(m[1]) : -1;
        }).filter(n => n >= 0);
        return nums.length > 0 ? Math.max(...nums) + 1 : 1;
      `)
    );

    for (let p = 1; p < totalPages; p++) {
      onProgress?.(`Chargement de la page ${p + 1} sur ${totalPages}…`);
      await page.goto(`https://www.worlds-awakening.com/fr/bestiaire?page=${p}`, {
        waitUntil: "load",
        timeout: 30000,
      });
      await page.waitForTimeout(4000);
      const pageCreatures = await extractCreatures();
      allCreatures.push(...pageCreatures);
      onProgress?.(`Page ${p + 1} : ${pageCreatures.length} créatures récupérées.`);
    }

    await page.close();
  } finally {
    await browser.close();
  }

  return allCreatures;
}
