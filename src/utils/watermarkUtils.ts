const LOGO_LIGHT = '/lovable-uploads/7105f4fa-22d9-4992-80aa-e0b6effc3bae.png';
const COMPANY_NAME = 'Finest Pools & Spas LLC';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function applyWatermark(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  
  try {
    const [sourceImg, logoImg] = await Promise.all([
      loadImage(objectUrl),
      loadImage(LOGO_LIGHT).catch(() => null),
    ]);

    const canvas = document.createElement('canvas');
    canvas.width = sourceImg.width;
    canvas.height = sourceImg.height;
    const ctx = canvas.getContext('2d')!;

    // Draw original image
    ctx.drawImage(sourceImg, 0, 0);

    const padding = Math.max(sourceImg.width, sourceImg.height) * 0.02;

    // Draw logo in bottom-right corner
    if (logoImg) {
      const logoMaxHeight = sourceImg.height * 0.08;
      const logoScale = logoMaxHeight / logoImg.height;
      const logoW = logoImg.width * logoScale;
      const logoH = logoImg.height * logoScale;
      const logoX = sourceImg.width - logoW - padding;
      const logoY = sourceImg.height - logoH - padding;

      ctx.globalAlpha = 0.6;
      ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
      ctx.globalAlpha = 1.0;
    }

    // Draw company name text in bottom-left
    const fontSize = Math.max(14, sourceImg.height * 0.025);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = fontSize * 0.08;
    const textX = padding;
    const textY = sourceImg.height - padding;
    ctx.strokeText(COMPANY_NAME, textX, textY);
    ctx.fillText(COMPANY_NAME, textX, textY);
    ctx.globalAlpha = 1.0;

    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9);
    });

    return new File([blob], file.name, { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
