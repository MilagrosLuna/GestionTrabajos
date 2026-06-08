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
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
    const safeName = `${Date.now()}.${ext}`;
    const imgRef = ref(this.storage, `/${ruta}/${safeName}`);
    await uploadBytes(imgRef, file);
    return await getDownloadURL(imgRef);
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
