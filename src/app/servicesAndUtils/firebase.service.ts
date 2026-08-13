import { Injectable } from '@angular/core';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  Firestore,
  addDoc,
  setDoc,
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
  onSnapshot,
  QueryOrderByConstraint,
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
    return addDoc(colRef, JSON.parse(JSON.stringify(data)));
  }

  async guardarConId(data: any, ruta: string, id: string): Promise<void> {
    const docRef = doc(this.db, ruta, id);
    await setDoc(docRef, JSON.parse(JSON.stringify(data)));
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

      // set con merge en vez de update: crea el documento la primera vez
      // (proyecto nuevo, contador todavia no existe) y lo actualiza si ya existe.
      transaction.set(contadorRef, { contador: siguienteContador }, { merge: true });
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

  async modificar(data: any, ruta: string): Promise<boolean> {
    const usuarioRef = collection(this.db, ruta);
    const documento = doc(usuarioRef, data.id);
    await updateDoc(documento, JSON.parse(JSON.stringify(data.data)));
    return true;
  }

  async obtenerDondeOrdenado(
    path: string,
    campo: string,
    valor: string,
    ordenCampo: string,
    ordenDir: 'asc' | 'desc' = 'asc'
  ): Promise<any[]> {
    const colRef = collection(this.db, path);
    const q = query(colRef, where(campo, '==', valor), orderBy(ordenCampo, ordenDir));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, data: d.data() }));
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

  escucharDocumento(ruta: string, id: string, callback: (data: any | null) => void): () => void {
    const docRef = doc(this.db, ruta, id);
    return onSnapshot(docRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.data() : null);
    });
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
