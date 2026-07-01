import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, addDoc, setDoc, runTransaction, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ==========================================
// CONFIGURACIÓN DE FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

function createEntity(collectionName) {
  let listCache = { data: null, timestamp: 0 };
  const CACHE_TTL = 15000; // 15 segundos

  return {
    clearCache() {
      listCache = { data: null, timestamp: 0 };
    },
    async get(id) {
      const docRef = doc(db, collectionName, String(id));
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() };
      }
      return null;
    },

    async list(force = false) {
      if (!force && listCache.data && (Date.now() - listCache.timestamp < CACHE_TTL)) {
        return listCache.data;
      }
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      listCache = { data, timestamp: Date.now() };
      return data;
    },

    async create(data) {
      this.clearCache();
      const colRef = collection(db, collectionName);
      const docRef = await addDoc(colRef, data);
      return { id: docRef.id, ...data };
    },

    async set(id, data, options = {}) {
      this.clearCache();
      const docRef = doc(db, collectionName, String(id));
      await setDoc(docRef, data, options);
      return { id: String(id), ...data };
    },

    async update(id, data) {
      this.clearCache();
      const docRef = doc(db, collectionName, String(id));
      await updateDoc(docRef, data);
      return { id: String(id), ...data };
    },

    async delete(id) {
      this.clearCache();
      const docRef = doc(db, collectionName, String(id));
      await deleteDoc(docRef);
    },

    async filter(params) {
      const colRef = collection(db, collectionName);
      let q = query(colRef);
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          q = query(q, where(key, "==", value));
        }
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  };
}

export const base44 = {
  entities: {
    Attendee: createEntity('attendees'),
    Mesa: createEntity('mesas'),
    MeetingSlot: createEntity('meetingSlots'),
    EventConfig: createEntity('eventConfig'),
  },
  runTransaction: (updateFunction) => runTransaction(db, updateFunction),
  writeBatch: () => writeBatch(db)
};
