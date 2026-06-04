import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  setDoc,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';
import {
  MoodEntry,
  JournalEntry,
  UserProfile,
  WallOfHopeMessage,
  FutureMeMessage,
  ChatMessage,
} from '../types';

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
}

const handleFirestoreError = (
  error: any,
  operationType: FirestoreErrorInfo['operationType'],
  path: string | null = null
): never => {
  if (error.code === 'permission-denied') {
    const errorInfo: FirestoreErrorInfo = {
      error: 'Access denied. You do not have permission to perform this action.',
      operationType,
      path,
    };
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
};

export const dbService = {
  auth: {
    loginWithEmail: (email: string, pass: string) =>
      signInWithEmailAndPassword(auth, email, pass),
    signUpWithEmail: (email: string, pass: string) =>
      createUserWithEmailAndPassword(auth, email, pass),
    logout: () => auth.signOut(),
    deleteAccount: async () => {
      const user = auth.currentUser;
      if (!user) return;
      const uid = user.uid;

      // Delete all collections that use uid field
      const uidCollections = ['moods', 'journal', 'goals', 'memories', 'decisions', 'futureMeMessages', 'wallOfHope'];
      for (const colName of uidCollections) {
        try {
          const snap = await getDocs(query(collection(db, colName), where('uid', '==', uid)));
          if (snap.docs.length > 0) {
            const batch = writeBatch(db);
            snap.docs.forEach((d) => batch.delete(d.ref));
            await batch.commit();
          }
        } catch (e) {
          console.error(`Error deleting from ${colName}:`, e);
        }
      }

      // wallOfHopeRateLimit is keyed by uid directly (not a query)
      try {
        await deleteDoc(doc(db, 'wallOfHopeRateLimit', uid));
      } catch (e) {
        console.error('Error deleting wallOfHopeRateLimit:', e);
      }

      // Chat subcollection under users/{uid}/chat
      try {
        const snap = await getDocs(collection(db, 'users', uid, 'chat'));
        if (snap.docs.length > 0) {
          const batch = writeBatch(db);
          snap.docs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (e) {
        console.error('Error deleting chat history:', e);
      }

      // Delete user profile doc
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (e) {
        console.error('Error deleting user profile:', e);
      }

      // Firebase Storage cleanup
      try {
        const storageRef = ref(storage, `futureMeAudio/${uid}/`);
        const fileList = await listAll(storageRef);
        await Promise.all(fileList.items.map((file) => deleteObject(file)));
      } catch (e) {
        console.error('Error purging storage assets:', e);
      }

      // Finally delete the Firebase Auth user
      await deleteUser(user);
    },
    getUserProfile: async (uid: string) => {
      try {
        const docRef = doc(db, 'users', uid);
        const snap = await getDoc(docRef);
        return snap.exists() ? (snap.data() as UserProfile) : null;
      } catch (e) {
        return handleFirestoreError(e, 'get', `users/${uid}`);
      }
    },
    createUserProfile: async (profile: UserProfile) => {
      try {
        await setDoc(doc(db, 'users', profile.uid), {
          ...profile,
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        handleFirestoreError(e, 'create', `users/${profile.uid}`);
      }
    },
  },

  moods: {
    save: async (entry: Omit<MoodEntry, 'id'>) => {
      try {
        return await addDoc(collection(db, 'moods'), {
          ...entry,
          timestamp: serverTimestamp(),
          intensity: entry.intensity || 5,
        });
      } catch (e) {
        handleFirestoreError(e, 'create', 'moods');
      }
    },
    update: async (id: string, data: Partial<MoodEntry>) => {
      try {
        await updateDoc(doc(db, 'moods', id), data);
      } catch (e) {
        handleFirestoreError(e, 'update', `moods/${id}`);
      }
    },
    subscribe: (uid: string, callback: (moods: MoodEntry[]) => void) => {
      const q = query(collection(db, 'moods'), where('uid', '==', uid));
      return onSnapshot(
        q,
        (snap) => {
          const moods = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MoodEntry));
          moods.sort((a, b) => {
            const tA = (a.timestamp as any)?.seconds || 0;
            const tB = (b.timestamp as any)?.seconds || 0;
            return tB - tA;
          });
          callback(moods.slice(0, 50));
        },
        (error) => handleFirestoreError(error, 'list', 'moods')
      );
    },
  },

  history: {
    saveMessage: async (uid: string, msg: Omit<ChatMessage, 'id'>) => {
      try {
        return await addDoc(collection(db, 'users', uid, 'chat'), {
          ...msg,
          timestamp: serverTimestamp(),
        });
      } catch (e) {
        handleFirestoreError(e, 'create', `users/${uid}/chat`);
      }
    },
    getMessages: async (uid: string): Promise<ChatMessage[]> => {
      try {
        const q = query(
          collection(db, 'users', uid, 'chat'),
          orderBy('timestamp', 'asc'),
          limit(100)
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          timestamp: d.data().timestamp?.toDate() || new Date(),
        } as ChatMessage));
      } catch (e) {
        return handleFirestoreError(e, 'list', `users/${uid}/chat`);
      }
    },
    clearHistory: async (uid: string) => {
      const q = query(collection(db, 'users', uid, 'chat'));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    },
  },

  journal: {
    save: async (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => {
      try {
        return await addDoc(collection(db, 'journal'), {
          ...entry,
          timestamp: serverTimestamp(),
        });
      } catch (e) {
        handleFirestoreError(e, 'create', 'journal');
      }
    },
    subscribe: (uid: string, callback: (entries: JournalEntry[]) => void) => {
      const q = query(collection(db, 'journal'), where('uid', '==', uid));
      return onSnapshot(
        q,
        (snap) => {
          const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JournalEntry));
          entries.sort((a, b) => {
            const tA = (a.timestamp as any)?.seconds || 0;
            const tB = (b.timestamp as any)?.seconds || 0;
            return tB - tA;
          });
          callback(entries.slice(0, 50));
        },
        (error) => handleFirestoreError(error, 'list', 'journal')
      );
    },
  },

  wall: {
    post: async (uid: string, text: string, lang: string) => {
      try {
        const postRef = await addDoc(collection(db, 'wallOfHope'), {
          uid,
          text,
          authorLang: lang,
          likes: 0,
          createdAt: serverTimestamp(),
        });
        
        // Update rate limit tracker (don't fail if this fails)
        try {
          await setDoc(doc(db, 'wallOfHopeRateLimit', uid), {
            lastPostAt: serverTimestamp(),
            uid // Explicit uid for deletion logic
          }, { merge: true });
        } catch (rateLimitError) {
          console.warn('Rate limit tracker update failed:', rateLimitError);
          // Don't throw - post was successful
        }
        
        return postRef;
      } catch (e) {
        handleFirestoreError(e, 'create', 'wallOfHope');
      }
    },
    subscribe: (callback: (messages: WallOfHopeMessage[]) => void) => {
      const q = query(collection(db, 'wallOfHope'), orderBy('createdAt', 'desc'), limit(50));
      return onSnapshot(
        q,
        (snap) => {
          const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WallOfHopeMessage));
          callback(msgs);
        },
        (error) => handleFirestoreError(error, 'list', 'wallOfHope')
      );
    },
    like: async (id: string, currentLikes: number, increment: boolean = true) => {
      try {
        await updateDoc(doc(db, 'wallOfHope', id), { 
          likes: increment ? currentLikes + 1 : Math.max(0, currentLikes - 1) 
        });
      } catch (e) {
        handleFirestoreError(e, 'update', `wallOfHope/${id}`);
      }
    },
    report: async (messageId: string, reporterUid: string, reason: string) => {
      try {
        await addDoc(collection(db, 'reports'), {
          messageId,
          reporterUid,
          reason,
          reportedAt: serverTimestamp(),
          status: 'pending',
        });
      } catch (e) {
        handleFirestoreError(e, 'create', 'reports');
      }
    },
  },

  futureMe: {
    save: async (msg: Omit<FutureMeMessage, 'id' | 'createdAt'>) => {
      try {
        const tags = msg.tags && msg.tags.length > 0 ? msg.tags : ['Reflection'];
        return await addDoc(collection(db, 'futureMeMessages'), {
          ...msg,
          tags,
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        handleFirestoreError(e, 'create', 'futureMeMessages');
      }
    },
    subscribe: (uid: string, callback: (messages: FutureMeMessage[]) => void) => {
      const q = query(collection(db, 'futureMeMessages'), where('uid', '==', uid));
      return onSnapshot(
        q,
        (snap) => {
          const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FutureMeMessage));
          msgs.sort((a, b) => {
            const tA = (a.createdAt as any)?.seconds || 0;
            const tB = (b.createdAt as any)?.seconds || 0;
            return tB - tA;
          });
          callback(msgs);
        },
        (error) => handleFirestoreError(error, 'list', 'futureMeMessages')
      );
    },
  },
};

