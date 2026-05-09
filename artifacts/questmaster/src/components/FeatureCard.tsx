import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  colorClass: string;
  href: string;
}

const FeatureCard = ({ icon: Icon, title, subtitle, colorClass, href }: FeatureCardProps) => {
  return (
    <Link
      to={href}
      className="group relative flex flex-col items-center rounded-xl border border-border/50 bg-gradient-card p-6 text-center shadow-card transition-all duration-500 hover:border-primary/30 hover:shadow-gold hover:-translate-y-1"
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-xl bg-primary/0 transition-all duration-500 group-hover:bg-primary/3" />
      
      <div className={`relative mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-border/50 bg-muted/50 transition-all duration-500 group-hover:scale-110 group-hover:border-primary/30 group-hover:shadow-gold ${colorClass}`}>
        <Icon className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
      </div>
      <h3 className="relative font-display text-base font-semibold text-foreground">
        {title}
      </h3>
      <p className="relative mt-1 text-sm text-muted-foreground">
        {subtitle}
      </p>
      
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-primary/60 transition-all duration-500 group-hover:w-12" />
    </Link>
  );
};

export default FeatureCard;
