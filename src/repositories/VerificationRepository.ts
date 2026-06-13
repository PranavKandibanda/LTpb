import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Verification } from '../types';

export class VerificationRepository {
  private static collectionName = 'verifications';

  static subscribeAll(callback: (verifications: Verification[]) => void): () => void {
    const q = query(collection(db, this.collectionName), orderBy('id', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const verifs: Verification[] = [];
      snapshot.forEach(docSnap => {
        verifs.push(docSnap.data() as Verification);
      });
      callback(verifs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
    });
  }

  static async create(verification: Verification): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, verification.id);
      await setDoc(docRef, verification);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${this.collectionName}/${verification.id}`);
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
