import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageCircle } from "lucide-react";
import vaeloriaLogo from "@/assets/vaeloria-logo-big.svg";
import guildryLogo from "@/assets/guildry-logo.webp";
import waLogo from "@/assets/wa-logo.png";
import PageAmbiance from "@/components/fantasy/PageAmbiance";
import waHome from "@/assets/partners/wa-home.png";
import waCodex from "@/assets/partners/wa-codex.png";
import waDiscord from "@/assets/partners/wa-discord.png";
import guildryHome from "@/assets/partners/guildry-home.png";
import vaeloriaHome from "@/assets/partners/vaeloria-home.png";
import vaeloriaDiscord from "@/assets/partners/vaeloria-discord.png";

const ScreenshotGallery = ({ images }: { images: { src: string; alt: string }[] }) => (
  <div className="grid gap-3 px-6 pb-6 md:grid-cols-3 md:px-8 md:pb-8">
    {images.map((img) => (
      <a
        key={img.src}
        href={img.src}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block overflow-hidden rounded-lg border border-[#d4b86a]/40 bg-black/40 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-gold"
      >
        <img
          src={img.src}
          alt={img.alt}
          loading="lazy"
          className="h-32 w-full object-cover object-top transition-transform duration-500 group-hover:scale-105 md:h-40"
        />
      </a>
    ))}
  </div>
);

const VAELORIA = {
  copper: "#b87d48",
  copperDark: "#a86e35",
  copperLight: "#c48a52",
  forest: "#4f6130",
  cream: "#fdfdf8",
  paper: "#f5f5f0",
  border: "#e8eaed",
  dark: "#2e2e2e",
  blueGray: "#8e97a8",
};

const Partners = () => {
  return (
    <div className="relative flex min-h-screen flex-col animate-fade-in">
      <PageAmbiance />
      <SEO
        title="Partenaires — Aetheria VTT"
        description="Découvrez les partenaires d'Aetheria VTT : communautés, créateurs et univers JDR francophones."
        path="/partners"
      />
      <Header />
      <main className="flex-1 pb-24 md:pb-12">
        <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
          <div className="mb-10 text-center">
            <h1 className="font-display text-3xl font-bold text-gradient-gold md:text-4xl">
              Nos Partenaires
            </h1>
            <p className="mt-3 text-muted-foreground">
              Communautés, créateurs et univers qui font vivre le JDR francophone.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-1">
            {/* Worlds Awakening */}
            <article className="group relative overflow-hidden rounded-2xl border border-[#d4b86a]/60 bg-gradient-to-b from-white to-[#f3f4f6] shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-gold">
              <div className="h-1 w-full bg-gradient-to-r from-[#c9a14a] via-[#e8c878] to-[#c9a14a]" />
              <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:gap-8 md:p-8">
                <a
                  href="https://www.worlds-awakening.com/fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-auto shrink-0 transition-transform duration-300 hover:scale-105"
                  aria-label="Visiter Worlds Awakening"
                >
                  <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-[#d4b86a]/50 bg-white p-3 shadow-inner md:h-40 md:w-40">
                    <img src={waLogo} alt="Logo Worlds Awakening" className="h-full w-full object-contain" loading="lazy" />
                  </div>
                </a>
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-block rounded-full border border-[#d4b86a]/60 bg-[#f3eccd] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8a6a1f]">
                    Partenaire officiel
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-bold text-[#2e2e2e] md:text-3xl">
                    Worlds Awakening
                  </h2>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#4a4a4a] md:text-base">
                    <p>
                      Worlds Awakening est l'univers et le système de jeu de rôle qui inspire
                      profondément Aetheria VTT. Codex officiel, bestiaire, ascendances, classes
                      et tenues — toutes les ressources WA sont nativement intégrées à la plateforme.
                    </p>
                    <p>
                      Un univers dark fantasy riche, soutenu par une équipe de créateurs passionnés
                      et une communauté francophone vivante.
                    </p>
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
                    <Button
                      asChild
                      className="font-semibold text-white shadow-md hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #d4b86a, #a8842b)" }}
                    >
                      <a href="https://discord.gg/K8pvRa7CCs" target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Rejoindre le Discord
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="font-semibold border-[#d4b86a] bg-white text-[#8a6a1f] hover:bg-[#faf5e6]">
                      <a href="https://www.worlds-awakening.com/fr" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Site officiel
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
              <ScreenshotGallery
                images={[
                  { src: waHome, alt: "Page d'accueil de Worlds Awakening" },
                  { src: waCodex, alt: "Codex de Worlds Awakening" },
                  { src: waDiscord, alt: "Serveur Discord de Worlds Awakening" },
                ]}
              />
            </article>

            {/* Guildry */}
            <article className="group relative overflow-hidden rounded-2xl border border-[#d4b86a]/50 bg-gradient-to-b from-white to-[#f3f4f6] shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-gold">
              <div className="h-1 w-full bg-gradient-to-r from-[#c9a14a] via-[#e8c878] to-[#c9a14a]" />
              <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:gap-8 md:p-8">
                <a
                  href="https://www.guildry.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-auto shrink-0 transition-transform duration-300 hover:scale-105"
                  aria-label="Visiter Guildry"
                >
                  <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-[#d4b86a]/50 bg-white p-3 shadow-inner md:h-40 md:w-40">
                    <img src={guildryLogo} alt="Logo Guildry" className="h-full w-full object-contain" loading="lazy" />
                  </div>
                </a>
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-block rounded-full border border-[#d4b86a]/60 bg-[#f3eccd] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8a6a1f]">
                    Communauté Partenaire
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-bold text-[#2e2e2e] md:text-3xl">
                    Guildry
                  </h2>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#4a4a4a] md:text-base">
                    <p>
                      Guildry est une plateforme et communauté francophone dédiée au JDR : recherche
                      de tables, organisation de parties, mise en relation entre joueurs et MJ.
                    </p>
                    <p>
                      Un partenaire de choix pour trouver ta prochaine campagne ou faire grandir
                      la tienne aux côtés d'Aetheria VTT.
                    </p>
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
                    <Button
                      asChild
                      className="font-semibold text-white shadow-md hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #d4b86a, #a8842b)" }}
                    >
                      <a href="https://www.guildry.fr/" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Site officiel
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
              <ScreenshotGallery
                images={[{ src: guildryHome, alt: "Page d'accueil de Guildry" }]}
              />
            </article>


            {/* Le Repos de Vaeloria */}
            <article
              className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(180deg, ${VAELORIA.cream} 0%, ${VAELORIA.paper} 100%)`,
                border: `1px solid ${VAELORIA.copperLight}55`,
                boxShadow: `0 10px 40px -10px ${VAELORIA.dark}80, inset 0 1px 0 #ffffffaa`,
              }}
            >
              {/* Bandeau cuivre */}
              <div
                className="h-1 w-full"
                style={{
                  background: `linear-gradient(90deg, ${VAELORIA.copperDark}, ${VAELORIA.copperLight}, ${VAELORIA.copperDark})`,
                }}
              />

              <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:gap-8 md:p-8">
                {/* Logo */}
                <a
                  href="https://vaeloria.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-auto shrink-0 transition-transform duration-300 hover:scale-105"
                  aria-label="Visiter Le Repos de Vaeloria"
                >
                  <div
                    className="flex h-32 w-32 items-center justify-center rounded-2xl p-4 md:h-40 md:w-40"
                    style={{
                      background: `radial-gradient(circle at 30% 20%, #ffffff 0%, ${VAELORIA.paper} 100%)`,
                      border: `1px solid ${VAELORIA.copperLight}40`,
                      boxShadow: `inset 0 0 24px ${VAELORIA.copperLight}15`,
                    }}
                  >
                    <img
                      src={vaeloriaLogo}
                      alt="Logo Le Repos de Vaeloria"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </a>

                {/* Contenu */}
                <div className="flex-1 text-center md:text-left">
                  <div
                    className="inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      background: `${VAELORIA.forest}15`,
                      color: VAELORIA.forest,
                      border: `1px solid ${VAELORIA.forest}40`,
                    }}
                  >
                    Communauté Partenaire
                  </div>
                  <h2
                    className="mt-3 font-display text-2xl font-bold md:text-3xl"
                    style={{ color: VAELORIA.dark }}
                  >
                    Le Repos de Vaeloria
                  </h2>
                  <div
                    className="mt-3 space-y-3 text-sm leading-relaxed md:text-base"
                    style={{ color: VAELORIA.dark + "cc" }}
                  >
                    <p>
                      Le Repos de Vaeloria est une communauté JDR francophone chaleureuse,
                      réunissant joueurs, MJ, créateurs et passionnés autour du jeu de rôle,
                      de l'écriture, des univers fantasy et de l'imaginaire partagé.
                    </p>
                    <p>
                      On y trouve des tables ouvertes, des projets de création collective,
                      des discussions sur les univers, des conseils de MJ, et surtout une
                      ambiance bienveillante où chacun trouve sa place — du débutant curieux
                      au vétéran des donjons.
                    </p>
                    <p
                      className="rounded-lg border-l-4 px-4 py-3 italic"
                      style={{
                        background: `${VAELORIA.forest}10`,
                        borderColor: VAELORIA.copperDark,
                        color: VAELORIA.dark,
                      }}
                    >
                      Un immense merci à toute l'équipe et à la communauté du Repos de
                      Vaeloria pour leur soutien, leur accueil et leur passion. Aetheria VTT
                      est fier de marcher à vos côtés sur les chemins de l'imaginaire.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
                    <Button
                      asChild
                      className="font-semibold transition-all hover:opacity-90 hover:shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${VAELORIA.copperLight}, ${VAELORIA.copperDark})`,
                        color: "#ffffff",
                        border: "none",
                        boxShadow: `0 4px 14px ${VAELORIA.copperDark}55`,
                      }}
                    >
                      <a
                        href="https://discord.gg/MVYGCd79ec"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Rejoindre le Discord
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="font-semibold transition-all hover:bg-white"
                      style={{
                        background: "#ffffff",
                        color: VAELORIA.forest,
                        border: `1.5px solid ${VAELORIA.forest}`,
                      }}
                    >
                      <a
                        href="https://vaeloria.fr/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Site officiel
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
              <ScreenshotGallery
                images={[
                  { src: vaeloriaHome, alt: "Site Le Repos de Vaeloria" },
                  { src: vaeloriaDiscord, alt: "Discord Le Repos de Vaeloria" },
                ]}
              />
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Partners;
