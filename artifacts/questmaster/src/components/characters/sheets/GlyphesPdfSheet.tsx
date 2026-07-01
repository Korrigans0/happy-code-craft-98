// GlyphesPdfSheet — fiche PDF interactive.
// Utilise le PDF original (public/glyphes/fiche-glyphes.pdf) comme fond visuel,
// détecte les champs AcroForm avec pdfjs, superpose des inputs HTML positionnés
// aux coordonnées exactes, sauvegarde les valeurs dans character.system_data.pdf_form,
// et permet l'export du PDF rempli via pdf-lib.

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Loader2, Save, X } from "lucide-react";
import { SheetHeader } from "./SheetSections";
import { useAutosave } from "./useAutosave";
import { toast } from "sonner";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PDF_URL = "/glyphes/fiche-glyphes.pdf";
const RENDER_SCALE = 1.6; // rendering scale for the background canvas

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

  const initialForm = useMemo(
    () => (character?.system_data?.pdf_form as Record<string, any>) || {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [character?.id],
  );
  const [formData, setFormData] = useState<Record<string, any>>(initialForm);

  // Autosave the form into character.system_data.pdf_form
  useAutosave(
    formData,
    (val) => {
      if (!editable) return;
      onSave?.({
        system_data: {
          ...(character?.system_data ?? {}),
          pdf_form: val,
        },
      });
    },
    800,
  );

  // Load + render the PDF once
  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    (async () => {
      setLoading(true);
      try {
        const loadingTask = pdfjsLib.getDocument(PDF_URL);
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        // Clear previous canvases (StrictMode re-run)
        container.innerHTML = "";

        const nextPages: { widthCss: number; heightCss: number }[] = [];
        const nextWidgets: FieldWidget[] = [];

        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: RENDER_SCALE });

          const pageWrap = document.createElement("div");
          pageWrap.style.position = "relative";
          pageWrap.style.margin = "0 auto 24px";
          pageWrap.style.width = `${viewport.width}px`;
          pageWrap.style.height = `${viewport.height}px`;
          pageWrap.style.boxShadow = "0 4px 24px rgba(0,0,0,.5)";
          pageWrap.style.background = "#fff";
          pageWrap.dataset.pageIndex = String(p - 1);
          container.appendChild(pageWrap);

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.display = "block";
          canvas.style.pointerEvents = "none";
          pageWrap.appendChild(canvas);

          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;

          nextPages.push({ widthCss: viewport.width, heightCss: viewport.height });

          // Extract widget annotations
          const annots = await page.getAnnotations();
          for (const a of annots) {
            if (a.subtype !== "Widget" || !a.fieldName) continue;
            const [x1, y1, x2, y2] = a.rect;
            // Convert to viewport-space rect
            const [vx1, vy1, vx2, vy2] = viewport.convertToViewportRectangle([x1, y1, x2, y2]);
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
        setPages(nextPages);
        setWidgets(nextWidgets);
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
    <div className="flex flex-col h-full min-h-0 bg-background">
      <div className="flex items-center justify-between gap-2 p-3 border-b border-border/40 bg-card/40 backdrop-blur">
        <div className="min-w-0 flex-1">
          <SheetHeader
            character={character}
            editable={editable}
            onSave={onSave}
            onEdit={onEdit}
          />
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

          <div ref={containerRef} />

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

/** Tiny portal helper (avoid extra createPortal import juggling). */
const FieldPortal = ({ host, children }: { host: HTMLElement; children: React.ReactNode }) => {
  // Use React DOM portal
  const ReactDOM = require("react-dom");
  return ReactDOM.createPortal(children, host);
};

export default GlyphesPdfSheet;
