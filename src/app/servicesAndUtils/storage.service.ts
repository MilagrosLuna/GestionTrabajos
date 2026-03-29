import { Injectable } from '@angular/core';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private storage = getStorage();

  constructor() {}

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
    let hora = new Date().getTime();
    let ubicacion = '/' + ruta + '/' + hora;
    const imgRef = ref(this.storage, ubicacion);

    await uploadBytes(imgRef, file);
    const imgUrl = await getDownloadURL(imgRef);
    return imgUrl;
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
