import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, RotateCcw, RotateCw, RotateCcwSquare, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface AvatarCropDialogProps {
  file: File | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: (blob: Blob) => Promise<void> | void;
  isUploading?: boolean;
}

const OUTPUT = 512;
const MAX_FRAME = 320;
const MIN_FRAME = 220;

type Rotation = 0 | 90 | 180 | 270;

const AvatarCropDialog = ({ file, open, onCancel, onConfirm, isUploading }: AvatarCropDialogProps) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<Rotation>(0);
  const [dragging, setDragging] = useState(false);
  const [frame, setFrame] = useState(MAX_FRAME);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const pinch = useRef<{ d: number; z: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Responsive frame size based on viewport
  useLayoutEffect(() => {
    const compute = () => {
      const vw = Math.min(window.innerWidth, window.innerHeight);
      const f = Math.max(MIN_FRAME, Math.min(MAX_FRAME, Math.floor(vw * 0.7)));
      setFrame(f);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const effW = imgSize ? (rotation % 180 === 0 ? imgSize.w : imgSize.h) : 0;
  const effH = imgSize ? (rotation % 180 === 0 ? imgSize.h : imgSize.w) : 0;

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    const img = new Image();
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      const minZ = Math.max(frame / img.naturalWidth, frame / img.naturalHeight);
      setMinZoom(minZ);
      setZoom(minZ);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file, frame]);

  useEffect(() => {
    if (!imgSize) return;
    const minZ = Math.max(frame / effW, frame / effH);
    setMinZoom(minZ);
    setZoom((z) => Math.max(z, minZ));
    setOffset({ x: 0, y: 0 });
  }, [rotation, imgSize, effW, effH, frame]);

  const clampOffset = useCallback((x: number, y: number, z: number) => {
    if (!imgSize) return { x: 0, y: 0 };
    const dispW = effW * z;
    const dispH = effH * z;
    const maxX = Math.max(0, (dispW - frame) / 2);
    const maxY = Math.max(0, (dispH - frame) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }, [imgSize, effW, effH, frame]);

  const setZoomClamped = useCallback((z: number) => {
    const clamped = Math.min(minZoom * 4, Math.max(minZoom, z));
    setZoom(clamped);
    setOffset((o) => clampOffset(o.x, o.y, clamped));
  }, [minZoom, clampOffset]);

  const onZoomChange = (val: number[]) => setZoomClamped(val[0]);

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset(clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, zoom));
  };
  const onPointerUp = () => setDragging(false);

  // Wheel zoom (desktop polish)
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0015);
    setZoomClamped(zoom * factor);
  };

  // Pinch-to-zoom (touch polish)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const dist = (t: TouchList) => {
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.hypot(dx, dy);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinch.current = { d: dist(e.touches), z: zoom };
        e.preventDefault();
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinch.current) {
        const d = dist(e.touches);
        setZoomClamped(pinch.current.z * (d / pinch.current.d));
        e.preventDefault();
      }
    };
    const onTouchEnd = () => { pinch.current = null; };
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [zoom, setZoomClamped]);

  const reset = () => {
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    if (imgSize) {
      const minZ = Math.max(frame / imgSize.w, frame / imgSize.h);
      setMinZoom(minZ);
      setZoom(minZ);
    }
  };

  const rotateBy = (delta: 90 | -90) => {
    setRotation((r) => (((r + delta) % 360 + 360) % 360) as Rotation);
  };

  const handleConfirm = async () => {
    if (!imgRef.current || !imgSize) return;
    const rot = document.createElement('canvas');
    rot.width = effW;
    rot.height = effH;
    const rctx = rot.getContext('2d');
    if (!rctx) return;
    rctx.imageSmoothingQuality = 'high';
    rctx.translate(effW / 2, effH / 2);
    rctx.rotate((rotation * Math.PI) / 180);
    rctx.drawImage(imgRef.current, -imgSize.w / 2, -imgSize.h / 2);

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingQuality = 'high';
    const srcSize = frame / zoom;
    const cx = effW / 2 - offset.x / zoom;
    const cy = effH / 2 - offset.y / zoom;
    const sx = cx - srcSize / 2;
    const sy = cy - srcSize / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(rot, sx, sy, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);
    ctx.restore();
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/png', 0.95));
    if (blob) await onConfirm(blob);
  };

  const onFrameKeyDown = (e: React.KeyboardEvent) => {
    if (!imgSize) return;
    const PAN = e.shiftKey ? 32 : 8;
    const ZOOM_STEP = 0.05;
    let handled = true;
    switch (e.key) {
      case 'ArrowLeft':  setOffset((o) => clampOffset(o.x - PAN, o.y, zoom)); break;
      case 'ArrowRight': setOffset((o) => clampOffset(o.x + PAN, o.y, zoom)); break;
      case 'ArrowUp':    setOffset((o) => clampOffset(o.x, o.y - PAN, zoom)); break;
      case 'ArrowDown':  setOffset((o) => clampOffset(o.x, o.y + PAN, zoom)); break;
      case '+': case '=': setZoomClamped(zoom + ZOOM_STEP); break;
      case '-': case '_': setZoomClamped(zoom - ZOOM_STEP); break;
      case '[': rotateBy(-90); break;
      case ']': rotateBy(90); break;
      case 'r': case 'R': reset(); break;
      default: handled = false;
    }
    if (handled) { e.preventDefault(); e.stopPropagation(); }
  };

  const zoomPct = minZoom > 0 ? Math.round((zoom / minZoom) * 100) : 100;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isUploading) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Aperçu de l'avatar</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Glissez ou flèches pour repositionner. Molette / pincement / +/- pour zoomer, [ / ] pour pivoter, R pour réinitialiser, Échap pour annuler.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div
              ref={containerRef}
              role="application"
              aria-label="Zone de recadrage de l'avatar."
              tabIndex={0}
              className="relative overflow-hidden rounded-full border-2 border-primary/40 bg-secondary touch-none select-none outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:shadow-[0_0_22px_hsl(var(--primary)/0.25)]"
              style={{ width: frame, height: frame, cursor: dragging ? 'grabbing' : 'grab' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={onWheel}
              onKeyDown={onFrameKeyDown}
            >
              {imgUrl && imgSize && (
                <img
                  ref={imgRef}
                  src={imgUrl}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: imgSize.w * zoom,
                    height: imgSize.h * zoom,
                    transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                    maxWidth: 'none',
                    pointerEvents: 'none',
                    transition: dragging ? 'none' : 'transform 120ms ease-out',
                  }}
                />
              )}
              {/* subtle inner ring */}
              <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/10" />
            </div>
            {/* zoom badge */}
            <div className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow">
              {zoomPct}%
            </div>
          </div>

          <div className="flex w-full items-center justify-center gap-2" role="group" aria-label="Rotation">
            <Button type="button" variant="outline" size="sm" onClick={() => rotateBy(-90)} disabled={isUploading} aria-label="Pivoter de 90 degrés vers la gauche">
              <RotateCcwSquare className="mr-1 h-4 w-4" aria-hidden="true" /> -90°
            </Button>
            <span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground" aria-live="polite">{rotation}°</span>
            <Button type="button" variant="outline" size="sm" onClick={() => rotateBy(90)} disabled={isUploading} aria-label="Pivoter de 90 degrés vers la droite">
              <RotateCw className="mr-1 h-4 w-4" aria-hidden="true" /> +90°
            </Button>
          </div>

          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <label htmlFor="avatar-zoom-slider" className="font-medium">Zoom</label>
              <button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <RotateCcw className="h-3 w-3" aria-hidden="true" /> Réinitialiser
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setZoomClamped(zoom - 0.1)} disabled={isUploading} aria-label="Dézoomer">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Slider
                id="avatar-zoom-slider"
                aria-label="Zoom de l'avatar"
                min={minZoom}
                max={minZoom * 4}
                step={0.01}
                value={[zoom]}
                onValueChange={onZoomChange}
                className="flex-1"
              />
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setZoomClamped(zoom + 0.1)} disabled={isUploading} aria-label="Zoomer">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="sr-only" aria-live="polite">
            Zoom {zoomPct} pour cent, rotation {rotation} degrés.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={isUploading}>Annuler</Button>
          <Button onClick={handleConfirm} disabled={isUploading} className="bg-gradient-gold hover:opacity-90">
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarCropDialog;
