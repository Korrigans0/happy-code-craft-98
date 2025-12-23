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
      className="group relative flex flex-col items-center rounded-xl border border-border/50 bg-gradient-card p-6 text-center shadow-card transition-all duration-300 hover:border-primary/30 hover:shadow-gold"
    >
      <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-border/50 bg-muted/50 transition-transform duration-300 group-hover:scale-110 ${colorClass}`}>
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-display text-base font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {subtitle}
      </p>
    </Link>
  );
};

export default FeatureCard;
