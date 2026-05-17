import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageCircle } from "lucide-react";
import vaeloriaLogo from "@/assets/vaeloria-logo-big.svg";

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
    <div className="flex min-h-screen flex-col bg-gradient-dark animate-fade-in">
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
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Partners;
