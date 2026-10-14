import { maxMenuImageEdge } from "@/lib/menus/media";

export async function prepareMenuImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || typeof createImageBitmap !== "function") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const largestEdge = Math.max(bitmap.width, bitmap.height);
    const scale = largestEdge > maxMenuImageEdge ? maxMenuImageEdge / largestEdge : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });
    if (!blob || blob.size >= file.size) {
      return file;
    }

    return new File([blob], "menu.jpg", { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
