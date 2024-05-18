import { Injectable } from '@angular/core';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from 'src/main';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor() {}

  async guardarFoto2(dataUrl: string, ruta: string) {
    let hora = new Date().getTime();
    let ubicacion = '/' + ruta + '/' + hora; 
    const imgRef = ref(storage, ubicacion);
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
    const imgRef = ref(storage, ubicacion);

    // Carga el archivo a Firebase Storage
    await uploadBytes(imgRef, file);
    // Obtiene la URL de descarga del archivo cargado
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
