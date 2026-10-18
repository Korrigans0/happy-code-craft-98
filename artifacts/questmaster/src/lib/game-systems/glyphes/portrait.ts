// Coordinates in the official landscape sheet, measured in PDF points.
export const PORTRAIT_RECT = { x: 15, top: 56, width: 106, height: 106 };

export function portraitPlacement(imageWidth: number, imageHeight: number, pageHeight: number) {
  const scale = Math.min(PORTRAIT_RECT.width / imageWidth, PORTRAIT_RECT.height / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    x: PORTRAIT_RECT.x + (PORTRAIT_RECT.width - width) / 2,
    y: pageHeight - PORTRAIT_RECT.top - (PORTRAIT_RECT.height + height) / 2,
    width,
    height,
  };
}

export async function portraitPng(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Portrait inaccessible");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Portrait indisponible");
    context.drawImage(image, 0, 0);
    const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      value => value ? resolve(value) : reject(new Error("Conversion du portrait impossible")), "image/png",
    ));
    return new Uint8Array(await png.arrayBuffer());
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}