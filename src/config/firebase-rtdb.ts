import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getDatabase, Database, ref, set, update, remove, get } from 'firebase/database';
import env from './env';
import logger from './logger';

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  databaseURL: env.FIREBASE_DATABASE_URL,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
};

class FirebaseRTDBService {
  private static instance: FirebaseRTDBService;
  private app: FirebaseApp | null = null;
  private db: Database | null = null;
  private isInitialized = false;

  private constructor() {
    if (!env.FIREBASE_DATABASE_URL) {
      logger.warn('Firebase Realtime Database URL not configured. Notifications will be disabled.');
      return;
    }

    try {
      if (getApps().length === 0) {
        this.app = initializeApp(firebaseConfig);
      } else {
        this.app = getApps()[0];
      }
      this.db = getDatabase(this.app);
      this.isInitialized = true;
      logger.info('Firebase Realtime Database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase Realtime Database:', error);
    }
  }

  static getInstance(): FirebaseRTDBService {
    if (!FirebaseRTDBService.instance) {
      FirebaseRTDBService.instance = new FirebaseRTDBService();
    }
    return FirebaseRTDBService.instance;
  }

  getDb(): Database | null {
    return this.db;
  }

  getApp(): FirebaseApp | null {
    return this.app;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  ref(path: string) {
    if (!this.db) throw new Error('Firebase RTDB not initialized');
    return ref(this.db, path);
  }

  async set(path: string, data: any) {
    if (!this.db) throw new Error('Firebase RTDB not initialized');
    return set(ref(this.db, path), data);
  }

  async update(path: string, data: any) {
    if (!this.db) throw new Error('Firebase RTDB not initialized');
    return update(ref(this.db, path), data);
  }

  async remove(path: string) {
    if (!this.db) throw new Error('Firebase RTDB not initialized');
    return remove(ref(this.db, path));
  }

  async get(path: string) {
    if (!this.db) throw new Error('Firebase RTDB not initialized');
    return get(ref(this.db, path));
  }
}

export default FirebaseRTDBService.getInstance();