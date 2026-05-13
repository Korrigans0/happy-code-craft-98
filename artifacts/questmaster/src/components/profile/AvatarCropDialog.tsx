import { useEffect, useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, RotateCcw, RotateCw, RotateCcwSquare } from 'lucide-react';

interface AvatarCropDialogProps {
  file: File | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: (blob: Blob) => Promise<void> | void;
  isUploading?: boolean;
}

const FRAME = 280;
const OUTPUT = 512;

type Rotation = 0 | 90 | 180 | 270;

const AvatarCropDialog = ({ file, open, onCancel, onConfirm, isUploading }: AvatarCropDialogProps) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<Rotation>(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Effective (post-rotation) dimensions
  const effW = imgSize ? (rotation % 180 === 0 ? imgSize.w : imgSize.h) : 0;
  const effH = imgSize ? (rotation % 180 === 0 ? imgSize.h : imgSize.w) : 0;

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    const img = new Image();
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      const minZ = Math.max(FRAME / img.naturalWidth, FRAME / img.naturalHeight);
      setMinZoom(minZ);
      setZoom(minZ);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Recompute minZoom when rotation flips orientation
  useEffect(() => {
    if (!imgSize) return;
    const minZ = Math.max(FRAME / effW, FRAME / effH);
    setMinZoom(minZ);
    setZoom((z) => Math.max(z, minZ));
    setOffset({ x: 0, y: 0 });
  }, [rotation, imgSize, effW, effH]);

  const clampOffset = useCallback((x: number, y: number, z: number) => {
    if (!imgSize) return { x: 0, y: 0 };
    const dispW = effW * z;
    const dispH = effH * z;
    const maxX = Math.max(0, (dispW - FRAME) / 2);
    const maxY = Math.max(0, (dispH - FRAME) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }, [imgSize, effW, effH]);

  const onZoomChange = (val: number[]) => {
    const z = val[0];
    setZoom(z);
    setOffset((o) => clampOffset(o.x, o.y, z));
  };

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

  const reset = () => {
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    if (imgSize) {
      const minZ = Math.max(FRAME / imgSize.w, FRAME / imgSize.h);
      setMinZoom(minZ);
      setZoom(minZ);
    }
  };

  const rotateBy = (delta: 90 | -90) => {
    setRotation((r) => (((r + delta) % 360 + 360) % 360) as Rotation);
  };

  const handleConfirm = async () => {
    if (!imgRef.current || !imgSize) return;

    // Step 1: bake rotation into an offscreen canvas with effective dims
    const rot = document.createElement('canvas');
    rot.width = effW;
    rot.height = effH;
    const rctx = rot.getContext('2d');
    if (!rctx) return;
    rctx.translate(effW / 2, effH / 2);
    rctx.rotate((rotation * Math.PI) / 180);
    rctx.drawImage(imgRef.current, -imgSize.w / 2, -imgSize.h / 2);

    // Step 2: crop circular region from the rotated source
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const srcSize = FRAME / zoom;
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
      case 'ArrowLeft':
        setOffset((o) => clampOffset(o.x - PAN, o.y, zoom));
        break;
      case 'ArrowRight':
        setOffset((o) => clampOffset(o.x + PAN, o.y, zoom));
        break;
      case 'ArrowUp':
        setOffset((o) => clampOffset(o.x, o.y - PAN, zoom));
        break;
      case 'ArrowDown':
        setOffset((o) => clampOffset(o.x, o.y + PAN, zoom));
        break;
      case '+':
      case '=': {
        const z = Math.min(minZoom * 4, zoom + ZOOM_STEP);
        setZoom(z);
        setOffset((o) => clampOffset(o.x, o.y, z));
        break;
      }
      case '-':
      case '_': {
        const z = Math.max(minZoom, zoom - ZOOM_STEP);
        setZoom(z);
        setOffset((o) => clampOffset(o.x, o.y, z));
        break;
      }
      case '[':
        rotateBy(-90);
        break;
      case ']':
        rotateBy(90);
        break;
      case 'r':
      case 'R':
        reset();
        break;
      default:
        handled = false;
    }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isUploading) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Aperçu de l'avatar</DialogTitle>
          <DialogDescription>
            Glissez ou utilisez les flèches pour repositionner. + / - pour zoomer, [ / ] pour pivoter, R pour réinitialiser, Échap pour annuler.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div
            role="application"
            aria-label="Zone de recadrage de l'avatar. Utilisez les flèches pour déplacer, plus et moins pour zoomer, crochets pour pivoter."
            tabIndex={0}
            className="relative overflow-hidden rounded-full border-2 border-primary/40 bg-secondary touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{ width: FRAME, height: FRAME, cursor: dragging ? 'grabbing' : 'grab' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
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
                }}
              />
            )}
          </div>

          <div className="flex items-center gap-2" role="group" aria-label="Rotation">
            <Button type="button" variant="outline" size="sm" onClick={() => rotateBy(-90)} disabled={isUploading} aria-label="Pivoter de 90 degrés vers la gauche">
              <RotateCcwSquare className="mr-1 h-4 w-4" aria-hidden="true" /> -90°
            </Button>
            <span className="min-w-12 text-center text-xs text-muted-foreground" aria-live="polite">{rotation}°</span>
            <Button type="button" variant="outline" size="sm" onClick={() => rotateBy(90)} disabled={isUploading} aria-label="Pivoter de 90 degrés vers la droite">
              <RotateCw className="mr-1 h-4 w-4" aria-hidden="true" /> +90°
            </Button>
          </div>

          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <label htmlFor="avatar-zoom-slider">Zoom</label>
              <button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <RotateCcw className="h-3 w-3" aria-hidden="true" /> Réinitialiser
              </button>
            </div>
            <Slider
              id="avatar-zoom-slider"
              aria-label="Zoom de l'avatar"
              min={minZoom}
              max={minZoom * 4}
              step={0.01}
              value={[zoom]}
              onValueChange={onZoomChange}
            />
          </div>

          <p className="sr-only" aria-live="polite">
            Zoom {Math.round((zoom / minZoom) * 100)} pour cent, rotation {rotation} degrés.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={isUploading}>Annuler</Button>
          <Button onClick={handleConfirm} disabled={isUploading} className="bg-gradient-gold hover:opacity-90">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarCropDialog;
