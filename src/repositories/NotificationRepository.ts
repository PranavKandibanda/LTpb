import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Notification } from '../types';

export class NotificationRepository {
  private static collectionName = 'notifications';

  static subscribeByUser(userId: string, callback: (notifications: Notification[]) => void): () => void {
    const q = query(
      collection(db, this.collectionName), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      snapshot.forEach(docSnap => {
        notifs.push(docSnap.data() as Notification);
      });
      callback(notifs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
    });
  }

  static async create(notification: Notification): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, notification.id);
      await setDoc(docRef, notification);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${this.collectionName}/${notification.id}`);
    }
  }

  static async markAsRead(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, { unread: false });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${this.collectionName}/${id}`);
    }
  }

  static async clearAll(userId: string): Promise<void> {
    try {
      const q = query(collection(db, this.collectionName), where('userId', '==', userId));
      const s = await getDocs(q);
      const batch = writeBatch(db);
      s.docs.forEach(docSnap => {
        batch.delete(doc(db, this.collectionName, docSnap.id));
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, this.collectionName);
    }
  }
}
