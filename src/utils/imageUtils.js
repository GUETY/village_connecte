// Utilitaires pour compresser/convertir les images côté client
export function isImageFile(file) {
  return file && file.type && file.type.startsWith("image/");
}

export async function compressImageToLimit(file, { maxSizeBytes = 3 * 1024 * 1024, maxWidth = 1600 } = {}) {
  if (!isImageFile(file)) throw new Error("Le fichier n'est pas une image.");
  // si déjà sous la limite, renvoyer tel quel
  if (file.size <= maxSizeBytes) return file;

  // lire en dataURL
  const dataUrl = await new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

  // charger image
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });

  // redimensionner si besoin
  const scale = Math.min(1, maxWidth / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  // essayer plusieurs qualités jusqu'à atteindre la taille cible
  for (let quality = 0.92; quality >= 0.38; quality -= 0.08) {
    /* canvas.toBlob async */
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob) continue;
    if (blob.size <= maxSizeBytes) {
      return new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" });
    }
  }

  // dernier essai qualité moyenne
  const finalBlob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.5));
  return new File([finalBlob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" });
}