import { type CSSProperties, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowRight, Pause, Play, Columns2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import sanctum from "@/assets/experimental/aetheria-sanctum.jpg";
import campaigns from "@/assets/experimental/campaigns.png";
import characters from "@/assets/experimental/characters.png";
import codex from "@/assets/experimental/codex.png";
import subscriptions from "@/assets/experimental/subscriptions.png";
import partners from "@/assets/experimental/partners.png";
import { adventureDestinations } from "./adventure-destinations";
import { useAdventureScene } from "./useAdventureScene";
import "./AdventureScene.css";

const artifacts = [campaigns, characters, codex, subscriptions, partners];
const dust = Array.from({ length: 18 }, (_, i) => ({
  "--dust-x": `${(i * 37 + 11) % 100}%`, "--dust-y": `${(i * 19 + 7) % 100}%`, "--dust-delay": `${i * -.7}s`,
} as CSSProperties));

export default function AdventureScene({ onCompare }: { onCompare: () => void }) {
  const { trackRef, stageRef, active, setActive, select, simplified, paused, setPaused } = useAdventureScene(adventureDestinations.length);
  const selected = adventureDestinations[active];

  const parallax = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || simplified || paused) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--pointer-x", String((event.clientX - rect.left) / rect.width - .5));
    event.currentTarget.style.setProperty("--pointer-y", String((event.clientY - rect.top) / rect.height - .5));
  };

  return (
    <section ref={trackRef} id="aventures-experimentales" className="adventure-experiment" data-tone={selected.tone} data-simple={simplified} data-paused={paused} aria-labelledby="adventure-title">
      <div ref={stageRef} className="adventure-stage" onPointerMove={parallax} onPointerLeave={(event) => {
        event.currentTarget.style.setProperty("--pointer-x", "0");
        event.currentTarget.style.setProperty("--pointer-y", "0");
      }}>
        <img className="adventure-background" src={sanctum} alt="" width={1536} height={1024} loading="lazy" />
        <div className="adventure-shade" aria-hidden="true" />
        {!simplified && <div className="adventure-dust" aria-hidden="true">{dust.map((style, i) => <i key={i} style={style} />)}</div>}
        <div className="adventure-comparison"><Button variant="ghost" size="sm" onClick={onCompare}><Columns2 />Version actuelle</Button></div>
        <header className="adventure-heading">
          <p>Conçu pour vos aventures</p>
          <h2 id="adventure-title">Tout pour vos aventures</h2>
          <p className="adventure-intro">Des outils puissants pour des expériences inoubliables</p>
        </header>
        <nav className="adventure-orbit" aria-label="Destinations Aetheria">
          {adventureDestinations.map((item, index) => (
            <Link key={item.href} to={item.href} className="adventure-object" data-active={active === index} onPointerEnter={(event) => { if (event.pointerType === "mouse") setActive(index); }} onFocus={() => setActive(index)} aria-label={`${item.title} — ${item.subtitle}`}>
              <img src={artifacts[index]} alt="" loading="lazy" decoding="async" width={816} height={816} />
              <span><item.icon size={14} />{item.title}</span>
            </Link>
          ))}
        </nav>
        <div className="adventure-detail" aria-live="polite" aria-atomic="true">
          <span className="adventure-number">0{active + 1} / 05</span>
          <h3>{selected.title}</h3>
          <p>{selected.subtitle}</p>
          <Button asChild variant="link" size="sm"><Link to={selected.href}>{selected.cta}<ArrowRight /></Link></Button>
        </div>
        <div className="adventure-footer">
          <div className="adventure-controls" aria-label="Explorer les destinations">
            <Button variant="ghost" size="icon" title="Destination précédente" aria-label="Destination précédente" onClick={() => select((active + 4) % 5)}><ArrowLeft /></Button>
            {adventureDestinations.map((item, index) => <Button key={item.href} variant="ghost" size="icon" title={item.title} aria-label={item.title} aria-pressed={index === active} onClick={() => select(index)}><item.icon /></Button>)}
            <Button variant="ghost" size="icon" title="Destination suivante" aria-label="Destination suivante" onClick={() => select((active + 1) % 5)}><ArrowRight /></Button>
            {!simplified && <Button variant="ghost" size="icon" title={paused ? "Reprendre les animations" : "Suspendre les animations"} aria-label={paused ? "Reprendre les animations" : "Suspendre les animations"} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play /> : <Pause />}</Button>}
          </div>
          <div className="adventure-progress" aria-hidden="true"><div /></div>
          <p className="adventure-hint"><ArrowDown size={12} />Faites défiler pour explorer Aetheria</p>
        </div>
      </div>
    </section>
  );
}