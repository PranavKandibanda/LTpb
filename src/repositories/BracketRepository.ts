import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
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

  static async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${this.collectionName}/${id}`);
    }
  }

  static async cleanupExpired(): Promise<number> {
    try {
      const now = new Date().toISOString();
      const q = query(
        collection(db, this.collectionName),
        where('expiresAt', '<', now),
        orderBy('expiresAt'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      let count = 0;
      snapshot.forEach(docSnap => {
        deleteDoc(docSnap.ref);
        count++;
      });
      return count;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${this.collectionName}/cleanup`);
      return 0;
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
