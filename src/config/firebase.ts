import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getFirestore, Firestore, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, collection, query, where, orderBy, limit, startAfter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import env from './env';

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
};

class FirebaseService {
  private static instance: FirebaseService;
  private app: FirebaseApp;
  private db: Firestore;

  private constructor() {
    if (getApps().length === 0) {
      this.app = initializeApp(firebaseConfig);
    } else {
      this.app = getApps()[0];
    }
    this.db = getFirestore(this.app);
  }

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  getDb(): Firestore {
    return this.db;
  }

  getApp(): FirebaseApp {
    return this.app;
  }

  async getDocument<T = DocumentData>(collectionName: string, docId: string): Promise<T | null> {
    const docRef = doc(this.db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
  }

  async setDocument(collectionName: string, docId: string, data: any): Promise<void> {
    const docRef = doc(this.db, collectionName, docId);
    await setDoc(docRef, data);
  }

  async updateDocument(collectionName: string, docId: string, data: any): Promise<void> {
    const docRef = doc(this.db, collectionName, docId);
    await updateDoc(docRef, data);
  }

  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    const docRef = doc(this.db, collectionName, docId);
    await deleteDoc(docRef);
  }

  async getDocuments<T = DocumentData>(
    collectionName: string,
    options: {
      where?: { field: string; operator: string; value: any }[];
      orderBy?: { field: string; direction: 'asc' | 'desc' }[];
      limit?: number;
      startAfter?: QueryDocumentSnapshot<DocumentData>;
    } = {}
  ): Promise<{ data: T[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
    const coll = collection(this.db, collectionName);
    let q: any = coll;

    const constraints: any[] = [];

    if (options.where) {
      for (const w of options.where) {
        constraints.push(where(w.field, w.operator as any, w.value));
      }
    }

    if (options.orderBy) {
      for (const o of options.orderBy) {
        constraints.push(orderBy(o.field, o.direction));
      }
    }

    if (options.limit) {
      constraints.push(limit(options.limit));
    }

    if (options.startAfter) {
      constraints.push(startAfter(options.startAfter));
    }

    q = query(coll, ...constraints);
    const snapshot = await getDocs(q);

    const data: T[] = snapshot.docs.map(doc => {
      const d = doc.data();
      return { id: doc.id, ...(d || {}) } as T;
    });
    const lastDoc: any = snapshot.docs[snapshot.docs.length - 1] || null;

    return { data, lastDoc };
  }
}

export default FirebaseService.getInstance();
