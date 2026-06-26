// SharedPdfPopups — Fenêtres flottantes pour les PDF partagés par le MJ.
//
// Le MJ partage un PDF via la bibliothèque média : il est synchronisé dans
// `tabletop_state.shared_documents` puis affiché à tous les participants
// dans une fenêtre déplaçable et redimensionnable au-dessus du plateau.
// Les joueurs peuvent masquer la fenêtre localement (croix), le MJ peut
// la fermer pour tout le monde (icône « fermer pour tous »).

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, X, Users, Minus, Square as SquareIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface SharedDocument {
  id: string;
  name: string;
  storage_path: string;
  added_at: number;
  added_by: string;
}

interface Props {
  documents: SharedDocument[];
  isGM: boolean;
  onUnshare: (id: string) => void;
}

const BUCKET = "gm-media";

export function SharedPdfPopups({ documents, isGM, onUnshare }: Props) {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  if (typeof document === "undefined") return null;
  const visible = documents.filter((d) => !hiddenIds.has(d.id));
  if (!visible.length) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {visible.map((doc, idx) => (
        <PdfWindow
          key={doc.id}
          doc={doc}
          initialOffset={idx * 28}
          isGM={isGM}
          onHide={() => setHiddenIds((p) => new Set(p).add(doc.id))}
          onUnshare={() => onUnshare(doc.id)}
        />
      ))}
    </div>,
    document.body,
  );
}

interface WinProps {
  doc: SharedDocument;
  initialOffset: number;
  isGM: boolean;
  onHide: () => void;
  onUnshare: () => void;
}

function PdfWindow({ doc, initialOffset, isGM, onHide, onUnshare }: WinProps) {
  const [pos, setPos] = useState(() => ({
    x: Math.max(40, window.innerWidth / 2 - 400 + initialOffset),
    y: Math.max(40, window.innerHeight / 2 - 300 + initialOffset),
  }));
  const [size, setSize] = useState({ w: 780, h: 600 });
  const [minimized, setMinimized] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const resizeRef = useRef<{ sx: number; sy: number; sw: number; sh: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.storage_path, 3600);
      if (!cancelled && !error && data?.signedUrl) setUrl(data.signedUrl);
    })();
    return () => { cancelled = true; };
  }, [doc.storage_path]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current) {
        setPos({
          x: Math.max(0, Math.min(window.innerWidth - 120, e.clientX - dragRef.current.dx)),
          y: Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragRef.current.dy)),
        });
      } else if (resizeRef.current) {
        const r = resizeRef.current;
        setSize({
          w: Math.max(320, r.sw + (e.clientX - r.sx)),
          h: Math.max(220, r.sh + (e.clientY - r.sy)),
        });
      }
    };
    const onUp = () => { dragRef.current = null; resizeRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <div
      className="pointer-events-auto absolute flex flex-col overflow-hidden rounded-lg border border-amber-600/40 bg-card shadow-2xl shadow-black/60"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: minimized ? 40 : size.h,
      }}
    >
      <div
        className="flex h-10 shrink-0 cursor-move items-center gap-2 border-b border-amber-700/30 bg-gradient-to-r from-amber-950/60 to-amber-900/30 px-3"
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          dragRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
        }}
      >
        <FileText className="h-4 w-4 text-amber-400" />
        <span className="flex-1 truncate text-sm font-medium text-foreground">{doc.name}</span>
        <Users className="h-3 w-3 text-amber-400/70" />
        <button
          type="button"
          onClick={() => setMinimized((m) => !m)}
          className="rounded p-1 text-muted-foreground hover:bg-background/60 hover:text-foreground"
          title={minimized ? "Restaurer" : "Réduire"}
        >
          {minimized ? <SquareIcon className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
        </button>
        {isGM && (
          <button
            type="button"
            onClick={onUnshare}
            className="rounded p-1 text-amber-400 hover:bg-destructive/20 hover:text-destructive"
            title="Fermer pour tous les joueurs"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {!isGM && (
          <button
            type="button"
            onClick={onHide}
            className="rounded p-1 text-muted-foreground hover:bg-background/60 hover:text-foreground"
            title="Masquer (le MJ partage toujours ce document)"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {!minimized && (
        <>
          <div className="flex-1 bg-neutral-900">
            {url ? (
              <iframe
                src={`${url}#toolbar=1&navpanes=0`}
                title={doc.name}
                className="h-full w-full border-0"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Chargement du document…
              </div>
            )}
          </div>
          <div
            className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize text-amber-600/40"
            onMouseDown={(e) => {
              resizeRef.current = { sx: e.clientX, sy: e.clientY, sw: size.w, sh: size.h };
            }}
            title="Redimensionner"
          >
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M14 14L14 10 M14 14L10 14 M14 14L6 14 M14 14L14 6" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
          </div>
        </>
      )}
    </div>
  );
}
