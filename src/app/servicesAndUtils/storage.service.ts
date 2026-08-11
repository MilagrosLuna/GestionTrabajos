import { Injectable } from '@angular/core';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private storage = getStorage();

  constructor() {}

  validateFile(file: File): void {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido. Solo JPG, PNG o PDF.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('El archivo es demasiado grande. Máximo 10 MB.');
    }
  }

  async guardarFoto2(dataUrl: string, ruta: string) {
    let hora = new Date().getTime();
    let ubicacion = '/' + ruta + '/' + hora;
    const imgRef = ref(this.storage, ubicacion);
    const blob = this.dataURLtoBlob(dataUrl);

    return await uploadBytes(imgRef, blob).then(async () => {
      return await getDownloadURL(imgRef).then(async (imgUrl) => {
        return imgUrl;
      });
    });
  }

  async guardarFoto(file: File, ruta: string) {
    this.validateFile(file);

    let uploadBlob: Blob = file;
    let ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';

    if (file.type !== 'application/pdf') {
      try {
        uploadBlob = await this.toWebp(file);
        if (uploadBlob.type === 'image/webp') {
          ext = 'webp';
        }
      } catch {
        uploadBlob = file; // Si falla la compresión, subimos el archivo original
      }
    }

    const safeName = `${Date.now()}.${ext}`;
    const imgRef = ref(this.storage, `/${ruta}/${safeName}`);
    await uploadBytes(imgRef, uploadBlob);
    return await getDownloadURL(imgRef);
  }

  // Convierte y reduce la imagen a WebP para que ocupe menos espacio en Storage
  private async toWebp(file: File, maxDimension = 1920, quality = 0.82): Promise<Blob> {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo comprimir la imagen'))),
        'image/webp',
        quality
      );
    });
  }

  private dataURLtoBlob(dataurl: any) {
    var arr = dataurl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
}
