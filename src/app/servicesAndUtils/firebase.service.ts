import { Injectable } from '@angular/core';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
  orderBy,
  limit,
  runTransaction,
  startAfter,
} from 'firebase/firestore';
import { environment } from 'src/environments/environment';

const firebaseConfig = environment.firebaseConfig;

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  db: Firestore;

  constructor() {
    const app =
      getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }

  guardar(data: any, ruta: string) {
    const colRef = collection(this.db, ruta);
    return addDoc(colRef, data);
  }

  async obtenerUno(ruta: string, uid: string) {
    const docSnap = await getDoc(doc(this.db, ruta, uid));
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        data: docSnap.data(),
      };
    }
    return null;
  }

  async obtener(ruta: string) {
    let array: any[] = [];
    const querySnapshot = await getDocs(collection(this.db, ruta));
    querySnapshot.forEach((doc) => {
      let data = {
        id: doc.id,
        data: doc.data(),
      };
      array.push(data);
    });
    return array;
  }

  async obtenerConPaginacion(
    ruta: string,
    ordenCampo: string,
    limiteRegistros: number,
    ultimoDoc: any = null
  ) {
    let array: any[] = [];
    let q;
    const colRef = collection(this.db, ruta);

    if (ultimoDoc) {
      q = query(
        colRef,
        orderBy(ordenCampo, 'desc'),
        startAfter(ultimoDoc),
        limit(limiteRegistros)
      );
    } else {
      q = query(colRef, orderBy(ordenCampo, 'desc'), limit(limiteRegistros));
    }

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      let data = {
        id: doc.id,
        data: doc.data(),
      };
      array.push(data);
    });

    return {
      data: array,
      ultimoDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
    };
  }

  async incrementarContador(contadorId: string): Promise<number> {
    const contadorRef = doc(this.db, 'contadores', contadorId);

    return runTransaction(this.db, async (transaction) => {
      const contadorSnap = await transaction.get(contadorRef);
      const contadorActual = Number(contadorSnap.data()?.['contador']) || 0;
      const siguienteContador = contadorActual + 1;

      transaction.update(contadorRef, { contador: siguienteContador });
      return siguienteContador;
    });
  }

  async getWhere(path: string, condicion: string, condicion2: string) {
    let array: any[] = [];
    const Collection = collection(this.db, path);
    const Query = query(Collection, where(condicion, '==', condicion2));
    const Snapshot = await getDocs(Query);
    Snapshot.forEach((doc) => {
      let data = {
        id: doc.id,
        data: doc.data(),
      };
      array.push(data);
    });
    return array;
  }

  async modificar(data: any, ruta: string) {
    let retorno = false;
    const usuarioRef = collection(this.db, ruta);
    const documento = doc(usuarioRef, data.id);
    await updateDoc(documento, data.data)
      .then(() => {
        retorno = true;
      })
      .catch(() => {});
    return retorno;
  }

  async obtenerDonde(path: string, condicion: string, condicion2: string) {
    let array: any[] = [];
    const Collection = collection(this.db, path);
    const Query = query(Collection, where(condicion, '==', condicion2));
    const Snapshot = await getDocs(Query);
    Snapshot.forEach((doc) => {
      let data = {
        id: doc.id,
        data: doc.data(),
      };
      array.push(data);
    });
    return array;
  }

  async borrar(data: any, ruta: string) {
    let retorno = false;
    const usuarioRef = collection(this.db, ruta);
    const documento = doc(usuarioRef, data.id);
    await deleteDoc(documento)
      .then(() => {
        retorno = true;
      })
      .catch(() => {});
    return retorno;
  }
}
