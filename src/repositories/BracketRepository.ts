import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { BracketData } from '../types';

const EXPIRY_DAYS = 30;

export class BracketRepository {
  private static collectionName = 'brackets';

  static async getById(id: string): Promise<BracketData | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as BracketData;
      }
      return null;
    } catch (error) {
      return handleFirestoreError(error, OperationType.GET, `${this.collectionName}/${id}`);
    }
  }

  static subscribe(id: string, callback: (data: BracketData | null) => void): Unsubscribe {
    const docRef = doc(db, this.collectionName, id);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as BracketData);
      } else {
        callback(null);
      }
    }, (error) => {
      console.warn('Bracket subscription error:', error);
      callback(null);
    });
  }

  static async create(data: BracketData): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, data.id);
      await setDoc(docRef, {
        ...data,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${this.collectionName}/${data.id}`);
    }
  }

  static async updateWinners(id: string, winnersMap: Record<string, { id: string; name: string; elo: number }>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, { winnersMap });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${this.collectionName}/${id}`);
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${this.collectionName}/${id}`);
    }
  }

  static async cleanupExpired(): Promise<void> {
    try {
      const now = new Date().toISOString();
      const q = query(
        collection(db, this.collectionName),
        where('expiresAt', '<', now)
      );
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        try {
          await deleteDoc(docSnap.ref);
        } catch (e) {
          console.warn('Failed to delete expired bracket', docSnap.id, e);
        }
      }
    } catch (error) {
      console.warn('Bracket cleanup skipped:', error);
    }
  }

  static getExpiresAt(): string {
    const d = new Date();
    d.setDate(d.getDate() + EXPIRY_DAYS);
    return d.toISOString();
  }

  static generateId(): string {
    return `bracket_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
