// GlyphesPdfSheet — fiche PDF interactive.
// Utilise le PDF original (public/glyphes/fiche-glyphes.pdf) comme fond visuel,
// détecte les champs AcroForm avec pdfjs, superpose des inputs HTML positionnés
// aux coordonnées exactes, sauvegarde les valeurs dans character.system_data.pdf_form,
// et permet l'export du PDF rempli via pdf-lib.

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Loader2, Maximize2, Save, X, ZoomIn, ZoomOut } from "lucide-react";
import { SheetHeader } from "./SheetSections";
import { getSystem } from "@/lib/systems";

import { toast } from "sonner";
import { PDF_BOXES } from "@/lib/game-systems/glyphes/sheetSync";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PDF_URL = "/glyphes/fiche-glyphes.pdf";
const RENDER_SCALE = 1.6; // rendering scale for the background canvas
const STANDARD_FONTS_URL = "/pdfjs/standard_fonts/";
const CMAPS_URL = "/pdfjs/cmaps/";

// Horizontal breathing room kept around the rendered page.
const PAGE_GUTTER = 24;
// The page is never shrunk below, nor enlarged beyond, these ratios.
const MIN_PAGE_FIT = 0.2;
const MAX_PAGE_FIT = 1.6;

/**
 * Ratio applied to a rendered page so it always fits the width the sheet has
 * available (full screen on desktop, narrow on mobile) without being cut off.
 */
function computeFit(availWidth: number, renderedWidth: number): number {
  if (!renderedWidth || availWidth <= 0) return 1;
  const raw = availWidth / renderedWidth;
  if (!Number.isFinite(raw)) return 1;
  return Math.min(MAX_PAGE_FIT, Math.max(MIN_PAGE_FIT, raw));
}

/**
 * Width the sheet really has. The page container can be wider than the panel
 * once a page overflows it, so the panel and the window are taken into account
 * as well and the smallest value wins.
 */
function availableSheetWidth(container: HTMLElement): number {
  const panel = container.closest<HTMLElement>('[role="dialog"]');
  const candidates = [
    panel ? panel.clientWidth : 0,
    container.clientWidth,
    window.innerWidth,
  ].filter((w) => w > 0);
  return candidates.length ? Math.min(...candidates) : window.innerWidth;
}

// --- Zoom -----------------------------------------------------------------
// The zoom is a multiplier applied on top of the auto-fit ratio, so 100 %
// always means "the page exactly fits the width of the sheet".
const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 1.25;
// Bitmap resolution limits: keep canvases inside what browsers allow.
const MAX_RENDER_SCALE = 6;
const MAX_BITMAP_PX = 12_000_000;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** One rendered page: its DOM nodes plus the pdfjs page needed to redraw it. */
interface PageRec {
  page: any;
  widthCss: number;
  heightCss: number;
  wrap: HTMLDivElement;
  inner: HTMLDivElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  bitmapScale: number;
}

/**
 * pdfjs render scale giving a sharp bitmap for the given on-screen ratio,
 * without ever exceeding the allowed canvas surface.
 */
function neededBitmapScale(rec: { widthCss: number; heightCss: number }, effective: number): number {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let scale = Math.max(RENDER_SCALE, RENDER_SCALE * effective * dpr);
  const area = rec.widthCss * rec.heightCss * (scale / RENDER_SCALE) ** 2;
  if (area > MAX_BITMAP_PX) scale *= Math.sqrt(MAX_BITMAP_PX / area);
  return Math.min(MAX_RENDER_SCALE, scale);
}

/** Nearest scrollable ancestor of an element (the sheet's scroll viewport). */
function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const overflow = getComputedStyle(node).overflowY;
    if (overflow === "auto" || overflow === "scroll" || overflow === "overlay") return node;
    node = node.parentElement;
  }
  return null;
}

interface Props {
  character: any;
  editable?: boolean;
  onSave?: (patch: any) => void;
  onClose?: () => void;
  onEdit?: () => void;
}

type FieldKind = "text" | "checkbox" | "select";
interface FieldWidget {
  id: string;                // unique per annotation
  fieldName: string;         // AcroForm field name (may repeat across widgets)
  kind: FieldKind;
  pageIndex: number;
  left: number;              // css px in scaled canvas
  top: number;
  width: number;
  height: number;
  options?: string[];        // for select
  exportValue?: string;      // for checkbox (/Yes value)
  multiline?: boolean;
}

const GlyphesPdfSheet = ({ character, editable, onSave, onClose, onEdit }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pages, setPages] = useState<{ widthCss: number; heightCss: number }[]>([]);
  const [widgets, setWidgets] = useState<FieldWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Le composant est remonté à chaque ouverture de personnage. Il ne faut pas
  // réinitialiser cet état lorsque le nouveau personnage reçoit son id après
  // sa première sauvegarde : c'était la cause des champs qui se vidaient.
  const [formData, setFormData] = useState<Record<string, any>>(
    () => (character?.system_data?.pdf_form as Record<string, any>) || {},
  );

  // Cases remplies automatiquement par la table (blessures, héroïsme) : suivre la base en direct.
  const remoteForm = (character?.system_data?.pdf_form as Record<string, any>) || {};
  const remoteBoxes = JSON.stringify([...PDF_BOXES.wounds, ...PDF_BOXES.heroism].map((n) => !!remoteForm[n]));
  useEffect(() => {
    const values: boolean[] = JSON.parse(remoteBoxes);
    const names = [...PDF_BOXES.wounds, ...PDF_BOXES.heroism];
    setFormData((prev) => {
      if (names.every((n, i) => !!prev[n] === values[i])) return prev;
      const next = { ...prev };
      names.forEach((n, i) => { next[n] = values[i]; });
      return next;
    });
  }, [remoteBoxes]);

  // Autosave the form into character.system_data.pdf_form.
  // Debounced effect: every local change is persisted 800 ms after the last keystroke.
  const saveRef = useRef<(val: Record<string, any>) => void>(() => {});
  saveRef.current = (val) => {
    if (!editable) return;
    onSave?.({
      system_data: {
        ...(character?.system_data ?? {}),
        pdf_form: val,
      },
    });
  };
  const skipFirstSave = useRef(true);

  useEffect(() => {
    // Ne pas ré-enregistrer l'état initial fraîchement chargé.
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    const t = setTimeout(() => saveRef.current(formData), 800);
    return () => clearTimeout(t);
  }, [formData]);

  // --- Zoom ---------------------------------------------------------------
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const fitRef = useRef(1);
  const pagesRef = useRef<PageRec[]>([]);
  const scrollParentRef = useRef<HTMLElement | null>(null);
  const renderingRef = useRef(false);
  const bitmapDirtyRef = useRef(false);
  const bitmapTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /** Resize every page for the current fit and zoom, without touching the bitmaps. */
  const layoutPages = useCallback(() => {
    const recs = pagesRef.current;
    const container = containerRef.current;
    if (!recs.length || !container) return;
    fitRef.current = computeFit(availableSheetWidth(container) - PAGE_GUTTER, recs[0].widthCss);
    const effective = fitRef.current * zoomRef.current;
    recs.forEach((rec) => {
      rec.inner.style.transform = `scale(${effective})`;
      rec.wrap.style.width = `${rec.widthCss * effective}px`;
      rec.wrap.style.height = `${rec.heightCss * effective}px`;
    });
  }, []);

  /** Redraw the page bitmaps at the resolution the current zoom needs. */
  const applyBitmaps = useCallback(async () => {
    if (renderingRef.current) {
      bitmapDirtyRef.current = true;
      return;
    }
    renderingRef.current = true;
    try {
      do {
        bitmapDirtyRef.current = false;
        for (const rec of pagesRef.current) {
          const wanted = neededBitmapScale(rec, fitRef.current * zoomRef.current);
          // Downscaling an already sharp bitmap costs nothing: skip it.
          if (wanted <= rec.bitmapScale * 1.05) continue;
          const viewport = rec.page.getViewport({ scale: wanted });
          rec.canvas.width = Math.round(viewport.width);
          rec.canvas.height = Math.round(viewport.height);
          await rec.page.render({ canvasContext: rec.ctx, viewport }).promise;
          rec.bitmapScale = wanted;
        }
      } while (bitmapDirtyRef.current);
    } catch (err) {
      console.error("[GlyphesPdfSheet] bitmap render", err);
    } finally {
      renderingRef.current = false;
    }
  }, []);

  const scheduleBitmaps = useCallback(() => {
    if (bitmapTimerRef.current) clearTimeout(bitmapTimerRef.current);
    bitmapTimerRef.current = setTimeout(() => void applyBitmaps(), 180);
  }, [applyBitmaps]);

  /** Apply a zoom level, keeping the anchored point of the sheet stationary. */
  const changeZoom = useCallback(
    (next: number, anchor?: { x: number; y: number }) => {
      const prev = zoomRef.current;
      const clamped = clamp(next, ZOOM_MIN, ZOOM_MAX);
      if (clamped === prev) return;
      zoomRef.current = clamped;
      setZoom(clamped);
      layoutPages();
      const sp = scrollParentRef.current;
      if (sp) {
        const k = clamped / prev;
        const ax = anchor ? anchor.x : sp.clientWidth / 2;
        const ay = anchor ? anchor.y : sp.clientHeight / 2;
        sp.scrollLeft = (sp.scrollLeft + ax) * k - ax;
        sp.scrollTop = (sp.scrollTop + ay) * k - ay;
      }
      scheduleBitmaps();
    },
    [layoutPages, scheduleBitmaps],
  );

  // Track the scroll viewport: zoom anchors on it and the wheel is caught there.
  useEffect(() => {
    const sp = findScrollParent(containerRef.current);
    scrollParentRef.current = sp;
    if (!sp) return;

    const onWheel = (e: WheelEvent) => {
      // Ctrl + wheel is the trackpad pinch gesture; a plain wheel still scrolls.
      if (!e.ctrlKey) return;
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const rect = sp.getBoundingClientRect();
      changeZoom(zoomRef.current * Math.exp(-dy * 0.002), {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    sp.addEventListener("wheel", onWheel, { passive: false });
    return () => sp.removeEventListener("wheel", onWheel);
  }, [changeZoom, pages]);

  // Drag with the mouse to pan the sheet once it is zoomed past the visible width.
  useEffect(() => {
    const container = containerRef.current;
    const sp = findScrollParent(container);
    if (!container || !sp) return;

    let start: { x: number; y: number; left: number; top: number } | null = null;
    let moved = false;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, label, button, a")) return;
      start = { x: e.clientX, y: e.clientY, left: sp.scrollLeft, top: sp.scrollTop };
      moved = false;
    };

    const onMove = (e: PointerEvent) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      moved = true;
      e.preventDefault();
      sp.scrollLeft = start.left - dx;
      sp.scrollTop = start.top - dy;
    };

    const onUp = () => {
      start = null;
    };

    container.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      container.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [pages]);

  // Load + render the PDF once
  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    (async () => {
      setLoading(true);
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: PDF_URL,
          standardFontDataUrl: STANDARD_FONTS_URL,
          cMapUrl: CMAPS_URL,
          cMapPacked: true,
        });
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        // Clear previous canvases (StrictMode re-run)
        container.innerHTML = "";
        pagesRef.current = [];

        const nextPages: { widthCss: number; heightCss: number }[] = [];
        const nextWidgets: FieldWidget[] = [];

        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: RENDER_SCALE });

          // The page is kept at RENDER_SCALE in the DOM and scaled with a CSS
          // transform so it always fits the width the sheet has and follows the
          // zoom. The field overlay is mounted inside the scaled element, so
          // input positions stay exact at every zoom level.
          const pageWrap = document.createElement("div");
          pageWrap.style.position = "relative";
          pageWrap.style.margin = "0 auto 24px";
          pageWrap.style.overflow = "hidden";
          pageWrap.style.boxShadow = "0 4px 24px rgba(0,0,0,.5)";
          container.appendChild(pageWrap);

          const pageInner = document.createElement("div");
          pageInner.style.position = "absolute";
          pageInner.style.top = "0";
          pageInner.style.left = "0";
          pageInner.style.width = `${viewport.width}px`;
          pageInner.style.height = `${viewport.height}px`;
          pageInner.style.transformOrigin = "top left";
          pageInner.style.background = "#fff";
          pageInner.dataset.pageIndex = String(p - 1);
          pageWrap.appendChild(pageInner);

          const canvas = document.createElement("canvas");
          canvas.style.display = "block";
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          canvas.style.pointerEvents = "none";
          pageInner.appendChild(canvas);

          pagesRef.current.push({
            page,
            widthCss: viewport.width,
            heightCss: viewport.height,
            wrap: pageWrap,
            inner: pageInner,
            canvas,
            ctx: canvas.getContext("2d")!,
            bitmapScale: 0,
          });

          nextPages.push({ widthCss: viewport.width, heightCss: viewport.height });

          // Extract widget annotations
          const annots = await page.getAnnotations();
          for (const a of annots) {
            if (a.subtype !== "Widget" || !a.fieldName) continue;
            const [x1, y1, x2, y2] = a.rect;
            // Convert to viewport-space rect
            const [vx1, vy1, vx2, vy2] = (viewport as any).convertToViewportRectangle([x1, y1, x2, y2]);
            const left = Math.min(vx1, vx2);
            const top = Math.min(vy1, vy2);
            const width = Math.abs(vx2 - vx1);
            const height = Math.abs(vy2 - vy1);

            let kind: FieldKind = "text";
            let options: string[] | undefined;
            let exportValue: string | undefined;
            const fieldType = a.fieldType; // 'Tx' | 'Btn' | 'Ch'
            if (fieldType === "Btn") {
              // Checkbox (ignore pushbuttons/radio for simplicity)
              if (a.checkBox) {
                kind = "checkbox";
                exportValue = a.exportValue || "Yes";
              } else {
                continue;
              }
            } else if (fieldType === "Ch") {
              kind = "select";
              options = (a.options || []).map((o: any) =>
                typeof o === "string" ? o : (o.displayValue ?? o.exportValue ?? ""),
              );
            }

            nextWidgets.push({
              id: `${p - 1}-${a.id}`,
              fieldName: a.fieldName,
              kind,
              pageIndex: p - 1,
              left,
              top,
              width,
              height,
              options,
              exportValue,
              multiline: !!a.multiLine,
            });
          }
        }

        if (cancelled) return;
        layoutPages();
        setPages(nextPages);
        setWidgets(nextWidgets);
        void applyBitmaps();
      } catch (err) {
        console.error("[GlyphesPdfSheet] load error", err);
        toast.error("Impossible de charger la fiche PDF");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the page fitted to the sheet when its width changes (resized window,
  // device rotation): only the transform and the reserved box are updated.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || pages.length === 0 || typeof ResizeObserver === "undefined") return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const apply = () => {
      layoutPages();
      scheduleBitmaps();
    };

    const observer = new ResizeObserver(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(apply, 120);
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [pages, layoutPages, scheduleBitmaps]);

  const setField = useCallback(
    (name: string, value: any) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  // Export the PDF with values filled in via pdf-lib
  const exportFilled = useCallback(async () => {
    try {
      setExporting(true);
      const buf = await fetch(PDF_URL).then((r) => r.arrayBuffer());
      const pdfDoc = await PDFDocument.load(buf);
      const form = pdfDoc.getForm();
      for (const [name, raw] of Object.entries(formData)) {
        try {
          const field = form.getField(name);
          if (field instanceof PDFTextField) {
            field.setText(String(raw ?? ""));
          } else if (field instanceof PDFCheckBox) {
            if (raw) field.check();
            else field.uncheck();
          } else if (field instanceof PDFDropdown) {
            if (raw) field.select(String(raw));
          }
        } catch {
          // field missing / different type — ignore
        }
      }
      const bytes = await pdfDoc.save();
      // Copy into a fresh ArrayBuffer (avoid SharedArrayBuffer typing on Blob)
      const ab = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(ab).set(bytes);
      const blob = new Blob([ab], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${character?.name || "personnage"}-glyphes.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Échec de l'export PDF");
    } finally {
      setExporting(false);
    }
  }, [formData, character?.name]);

  return (
    <div
      className="flex flex-col h-full min-h-0 bg-background"
      onKeyDown={(e) => {
        // Keyboard shortcuts, ignored while typing in a field.
        if ((e.target as HTMLElement)?.closest("input, textarea, select")) return;
        if (e.key === "+" || e.key === "=") changeZoom(zoomRef.current * ZOOM_STEP);
        else if (e.key === "-" || e.key === "_") changeZoom(zoomRef.current / ZOOM_STEP);
        else if (e.key === "0") changeZoom(1);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-card/40 p-3 backdrop-blur">
        <div className="min-w-0 flex-1 basis-full sm:basis-auto">
          <SheetHeader
            character={character}
            system={getSystem(character?.system)}
            editable={editable}
            onEdit={onEdit}
            onChange={(k, v) => onSave?.({ [k]: v })}
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border/50 bg-card/40 px-1 py-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => changeZoom(zoomRef.current / ZOOM_STEP)}
            disabled={zoom <= ZOOM_MIN}
            aria-label="Dézoomer"
            title="Dézoomer"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-[3.5rem] text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)} %
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => changeZoom(zoomRef.current * ZOOM_STEP)}
            disabled={zoom >= ZOOM_MAX}
            aria-label="Zoomer"
            title="Zoomer"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => changeZoom(1)}
            disabled={zoom <= ZOOM_MIN}
            aria-label="Ajuster à la largeur"
            title="Ajuster à la largeur"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={exportFilled}
            disabled={exporting || loading}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exporter PDF
          </Button>
          {editable && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
              <Save className="h-3 w-3" /> Sauvegarde auto
            </div>
          )}
          {onClose && (
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="relative py-6" style={{ background: "hsl(var(--muted))" }}>
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              Chargement de la fiche…
            </div>
          )}

          <div ref={containerRef} style={{ cursor: zoom > 1 ? "grab" : undefined }} />

          {/* Overlay inputs positioned on top of each rendered page. We portal
              them inside the correct pageWrap after render via absolute wrapper. */}
          {!loading && pages.length > 0 && (
            <div className="pointer-events-none">
              {pages.map((pg, i) => (
                <PageOverlay
                  key={i}
                  pageIndex={i}
                  pageSize={pg}
                  widgets={widgets.filter((w) => w.pageIndex === i)}
                  formData={formData}
                  editable={!!editable}
                  onChange={setField}
                  containerRef={containerRef}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

/**
 * PageOverlay: mounts absolutely-positioned inputs INTO the corresponding
 * pageWrap div that pdfjs rendered inside containerRef. We compute a portal
 * target lazily.
 */
const PageOverlay = ({
  pageIndex,
  pageSize,
  widgets,
  formData,
  editable,
  onChange,
  containerRef,
}: {
  pageIndex: number;
  pageSize: { widthCss: number; heightCss: number };
  widgets: FieldWidget[];
  formData: Record<string, any>;
  editable: boolean;
  onChange: (name: string, value: any) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const [host, setHost] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const pageWrap = c.querySelector<HTMLDivElement>(
      `[data-page-index="${pageIndex}"]`,
    );
    if (!pageWrap) return;

    // Attach a dedicated overlay layer once
    let layer = pageWrap.querySelector<HTMLDivElement>(":scope > .fields-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "fields-layer";
      layer.style.position = "absolute";
      layer.style.inset = "0";
      layer.style.pointerEvents = "auto";
      pageWrap.appendChild(layer);
    }
    setHost(layer);
    return () => {
      // don't remove; canvas is re-created on remount
    };
  }, [pageIndex, containerRef, pageSize.widthCss, pageSize.heightCss]);

  if (!host) return null;

  return (
    <>
      {widgets.map((w) => {
        const style: React.CSSProperties = {
          position: "absolute",
          left: w.left,
          top: w.top,
          width: w.width,
          height: w.height,
        };
        const value = formData[w.fieldName];
        return (
          <FieldPortal key={w.id} host={host}>
            {w.kind === "text" && (
              w.multiline || w.height > 40 ? (
                <textarea
                  style={{ ...style, resize: "none" }}
                  className="bg-amber-200/20 hover:bg-amber-200/30 focus:bg-amber-100/40 focus:outline-none focus:ring-1 focus:ring-amber-500 text-black rounded-sm px-1 py-0.5 leading-tight"
                  value={value ?? ""}
                  onChange={(e) => onChange(w.fieldName, e.target.value)}
                  disabled={!editable}
                />
              ) : (
                <input
                  type="text"
                  style={style}
                  className="bg-amber-200/20 hover:bg-amber-200/30 focus:bg-amber-100/40 focus:outline-none focus:ring-1 focus:ring-amber-500 text-black rounded-sm px-1"
                  value={value ?? ""}
                  onChange={(e) => onChange(w.fieldName, e.target.value)}
                  disabled={!editable}
                />
              )
            )}
            {w.kind === "checkbox" && (
              <label
                style={style}
                className="flex items-center justify-center cursor-pointer bg-amber-200/10 hover:bg-amber-200/30 rounded-sm"
              >
                <input
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => onChange(w.fieldName, e.target.checked)}
                  disabled={!editable}
                  className="w-full h-full accent-amber-600 cursor-pointer opacity-90"
                  style={{ margin: 0 }}
                />
              </label>
            )}
            {w.kind === "select" && (
              <select
                style={style}
                className="bg-amber-200/20 hover:bg-amber-200/30 focus:bg-amber-100/40 focus:outline-none text-black rounded-sm px-1"
                value={value ?? ""}
                onChange={(e) => onChange(w.fieldName, e.target.value)}
                disabled={!editable}
              >
                <option value="">—</option>
                {(w.options ?? []).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            )}
          </FieldPortal>
        );
      })}
    </>
  );
};

/** Tiny portal helper. */
const FieldPortal = ({ host, children }: { host: HTMLElement; children: React.ReactNode }) => {
  return createPortal(children, host);
};

export default GlyphesPdfSheet;
