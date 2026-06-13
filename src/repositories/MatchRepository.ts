import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Match } from '../types';

export class MatchRepository {
  private static collectionName = 'matches';

  static async getById(id: string): Promise<Match | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as Match;
      }
      return null;
    } catch (error) {
      return handleFirestoreError(error, OperationType.GET, `${this.collectionName}/${id}`);
    }
  }

  static async getAll(): Promise<Match[]> {
    try {
      const q = query(collection(db, this.collectionName), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const matches: Match[] = [];
      snapshot.forEach(docSnap => {
        matches.push(docSnap.data() as Match);
      });
      return matches;
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, this.collectionName);
    }
  }

  static subscribeAll(callback: (matches: Match[]) => void): () => void {
    const q = query(collection(db, this.collectionName), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const matches: Match[] = [];
      snapshot.forEach(docSnap => {
        matches.push(docSnap.data() as Match);
      });
      callback(matches);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
    });
  }

  static async create(match: Match): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, match.id);
      await setDoc(docRef, match);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${this.collectionName}/${match.id}`);
    }
  }

  static async update(id: string, updates: Partial<Match>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, updates);
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
}
