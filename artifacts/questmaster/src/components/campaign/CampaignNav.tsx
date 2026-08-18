import { ChevronDown, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface CampaignTabItem {
  id: string;
  icon: LucideIcon;
  label: string;
  description?: string;
}

export interface CampaignNavGroup {
  id: string;
  icon: LucideIcon;
  label: string;
  items: CampaignTabItem[];
}

interface CampaignNavProps {
  groups: CampaignNavGroup[];
  activeTab: string;
  onSelect: (tabId: string) => void;
}

/**
 * Grouped campaign navigation: a small set of top-level entries, each of which
 * either activates a single tab or opens a sub-menu with related sections.
 */
export default function CampaignNav({ groups, activeTab, onSelect }: CampaignNavProps) {
  return (
    <nav className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-muted/60 p-1 backdrop-blur-sm">
      {groups.map((group) => {
        const activeItem = group.items.find((i) => i.id === activeTab);
        const isActive = Boolean(activeItem);

        const baseClass = cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary/15 text-primary shadow-inner"
            : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
        );

        if (group.items.length === 1) {
          const item = group.items[0];
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={baseClass}
              title={group.label}
            >
              <group.icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{group.label}</span>
            </button>
          );
        }

        return (
          <DropdownMenu key={group.id}>
            <DropdownMenuTrigger className={baseClass} title={group.label}>
              <group.icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">
                {activeItem ? `${group.label} · ${activeItem.label}` : group.label}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60 bg-popover">
              {group.items.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onSelect={() => onSelect(item.id)}
                  className={cn(
                    "flex items-start gap-2 cursor-pointer",
                    item.id === activeTab && "bg-primary/10 text-primary",
                  )}
                >
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="flex flex-col">
                    <span className="text-sm">{item.label}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    )}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </nav>
  );
}
