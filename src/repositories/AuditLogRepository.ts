import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { AuditLog } from '../types';

export class AuditLogRepository {
  private static collectionName = 'audit_logs';

  static async getAll(): Promise<AuditLog[]> {
    try {
      const q = query(collection(db, this.collectionName), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const logs: AuditLog[] = [];
      snapshot.forEach(docSnap => {
        logs.push(docSnap.data() as AuditLog);
      });
      return logs;
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, this.collectionName);
    }
  }

  static subscribeAll(callback: (logs: AuditLog[]) => void): () => void {
    const q = query(collection(db, this.collectionName), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const logs: AuditLog[] = [];
      snapshot.forEach(docSnap => {
        logs.push(docSnap.data() as AuditLog);
      });
      callback(logs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
    });
  }

  static async create(log: AuditLog): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, log.id);
      await setDoc(docRef, log);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${this.collectionName}/${log.id}`);
    }
  }
}
