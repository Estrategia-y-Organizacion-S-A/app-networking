import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, addDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ==========================================
// CONFIGURACIÓN DE FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAh1Cn9eH1Pf2xQNIFpu2WhU44_IAXl0VU",
  authDomain: "galicia-suroeste-networking.firebaseapp.com",
  projectId: "galicia-suroeste-networking",
  storageBucket: "galicia-suroeste-networking.firebasestorage.app",
  messagingSenderId: "65024995931",
  appId: "1:65024995931:web:14421191f29496ed91857e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

function createEntity(collectionName) {
  return {
    async get(id) {
      const docRef = doc(db, collectionName, String(id));
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() };
      }
      return null;
    },

    async list() {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async create(data) {
      const colRef = collection(db, collectionName);
      const docRef = await addDoc(colRef, data);
      return { id: docRef.id, ...data };
    },

    async set(id, data) {
      const docRef = doc(db, collectionName, String(id));
      await setDoc(docRef, data);
      return { id: String(id), ...data };
    },

    async update(id, data) {
      const docRef = doc(db, collectionName, String(id));
      await updateDoc(docRef, data);
      return { id: String(id), ...data };
    },

    async delete(id) {
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
    },

    subscribe(_callback) {
      return () => {};
    },
  };
}

export const base44 = {
  entities: {
    Attendee: createEntity('attendees'),
    Mesa: createEntity('mesas'),
    MeetingSlot: createEntity('meetingSlots'),
    EventConfig: createEntity('eventConfig'),
  },
};
