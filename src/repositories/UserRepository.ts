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
import { User } from '../types';

export class UserRepository {
  private static collectionName = 'players';

  static async getById(id: string): Promise<User | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as User;
      }
      return null;
    } catch (error) {
      return handleFirestoreError(error, OperationType.GET, `${this.collectionName}/${id}`);
    }
  }

  static async getAll(): Promise<User[]> {
    try {
      const q = query(collection(db, this.collectionName), orderBy('elo', 'desc'));
      const snapshot = await getDocs(q);
      const users: User[] = [];
      snapshot.forEach(docSnap => {
        users.push(docSnap.data() as User);
      });
      return users;
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, this.collectionName);
    }
  }

  static subscribeAll(callback: (users: User[]) => void): () => void {
    const q = query(collection(db, this.collectionName), orderBy('elo', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach(docSnap => {
        users.push(docSnap.data() as User);
      });
      callback(users);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
    });
  }

  static async create(user: User): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, user.id);
      await setDoc(docRef, user);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${this.collectionName}/${user.id}`);
    }
  }

  static async update(id: string, updates: Partial<User>): Promise<void> {
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
