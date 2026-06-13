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
import { Challenge } from '../types';

export class ChallengeRepository {
  private static collectionName = 'challenges';

  static async getById(id: string): Promise<Challenge | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as Challenge;
      }
      return null;
    } catch (error) {
      return handleFirestoreError(error, OperationType.GET, `${this.collectionName}/${id}`);
    }
  }

  static async getAll(): Promise<Challenge[]> {
    try {
      const q = query(collection(db, this.collectionName), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const challenges: Challenge[] = [];
      snapshot.forEach(docSnap => {
        challenges.push(docSnap.data() as Challenge);
      });
      return challenges;
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, this.collectionName);
    }
  }

  static subscribeAll(callback: (challenges: Challenge[]) => void): () => void {
    const q = query(collection(db, this.collectionName), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const challenges: Challenge[] = [];
      snapshot.forEach(docSnap => {
        challenges.push(docSnap.data() as Challenge);
      });
      callback(challenges);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
    });
  }

  static async create(challenge: Challenge): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, challenge.id);
      await setDoc(docRef, challenge);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${this.collectionName}/${challenge.id}`);
    }
  }

  static async update(id: string, updates: Partial<Challenge>): Promise<void> {
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
