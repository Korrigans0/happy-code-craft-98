import { useEffect, useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, RotateCcw } from 'lucide-react';

interface AvatarCropDialogProps {
  file: File | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: (blob: Blob) => Promise<void> | void;
  isUploading?: boolean;
}

const FRAME = 280; // visible circular frame size in px
const OUTPUT = 512; // exported avatar size

const AvatarCropDialog = ({ file, open, onCancel, onConfirm, isUploading }: AvatarCropDialogProps) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load file into image
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
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clampOffset = useCallback((x: number, y: number, z: number) => {
    if (!imgSize) return { x: 0, y: 0 };
    const dispW = imgSize.w * z;
    const dispH = imgSize.h * z;
    const maxX = Math.max(0, (dispW - FRAME) / 2);
    const maxY = Math.max(0, (dispH - FRAME) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }, [imgSize]);

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
    setZoom(minZoom);
    setOffset({ x: 0, y: 0 });
  };

  const handleConfirm = async () => {
    if (!imgRef.current || !imgSize) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Source rect in image coordinates corresponding to the visible FRAME
    const srcSize = FRAME / zoom; // square
    const cx = imgSize.w / 2 - offset.x / zoom;
    const cy = imgSize.h / 2 - offset.y / zoom;
    const sx = cx - srcSize / 2;
    const sy = cy - srcSize / 2;
    // Circular mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(imgRef.current, sx, sy, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);
    ctx.restore();
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/png', 0.95));
    if (blob) await onConfirm(blob);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isUploading) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Aperçu de l'avatar</DialogTitle>
          <DialogDescription>Glissez pour repositionner, ajustez le zoom puis confirmez.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div
            className="relative overflow-hidden rounded-full border-2 border-primary/40 bg-secondary touch-none select-none"
            style={{ width: FRAME, height: FRAME, cursor: dragging ? 'grabbing' : 'grab' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {imgUrl && imgSize && (
              <img
                ref={imgRef}
                src={imgUrl}
                alt="aperçu"
                draggable={false}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: imgSize.w * zoom,
                  height: imgSize.h * zoom,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  maxWidth: 'none',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Zoom</span>
              <button type="button" onClick={reset} className="inline-flex items-center gap-1 hover:text-foreground">
                <RotateCcw className="h-3 w-3" /> Réinitialiser
              </button>
            </div>
            <Slider min={minZoom} max={minZoom * 4} step={0.01} value={[zoom]} onValueChange={onZoomChange} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={isUploading}>Annuler</Button>
          <Button onClick={handleConfirm} disabled={isUploading} className="bg-gradient-gold hover:opacity-90">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarCropDialog;
