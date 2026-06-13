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
  where,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Season, SeasonResult } from '../types';

export class SeasonRepository {
  private static collectionName = 'seasons';
  private static resultsCollection = 'season_results';

  static async getById(id: string): Promise<Season | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as Season;
      }
      return null;
    } catch (error) {
      return handleFirestoreError(error, OperationType.GET, `${this.collectionName}/${id}`);
    }
  }

  static async getAll(): Promise<Season[]> {
    try {
      const q = query(collection(db, this.collectionName), orderBy('startDate', 'desc'));
      const snapshot = await getDocs(q);
      const seasons: Season[] = [];
      snapshot.forEach(docSnap => {
        seasons.push(docSnap.data() as Season);
      });
      return seasons;
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, this.collectionName);
    }
  }

  static subscribeAll(callback: (seasons: Season[]) => void): () => void {
    const q = query(collection(db, this.collectionName), orderBy('startDate', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const seasons: Season[] = [];
      snapshot.forEach(docSnap => {
        seasons.push(docSnap.data() as Season);
      });
      callback(seasons);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
    });
  }

  static async getActive(): Promise<Season | null> {
    try {
      const q = query(collection(db, this.collectionName), where('active', '==', true));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as Season;
      }
      return null;
    } catch (error) {
      return handleFirestoreError(error, OperationType.GET, this.collectionName);
    }
  }

  static async create(season: Season): Promise<void> {
    try {
      // If setting to active, deactivate all other seasons first
      if (season.active) {
        const active = await this.getActive();
        if (active && active.id !== season.id) {
          await this.update(active.id, { active: false });
        }
      }
      const docRef = doc(db, this.collectionName, season.id);
      await setDoc(docRef, season);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${this.collectionName}/${season.id}`);
    }
  }

  static async update(id: string, updates: Partial<Season>): Promise<void> {
    try {
      if (updates.active) {
        const active = await this.getActive();
        if (active && active.id !== id) {
          await this.update(active.id, { active: false });
        }
      }
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

  // Season results: Gold, Silver, Bronze placement recording
  static async saveSeasonResult(result: SeasonResult): Promise<void> {
    try {
      const docRef = doc(db, this.resultsCollection, result.id);
      await setDoc(docRef, result);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${this.resultsCollection}/${result.id}`);
    }
  }

  static async getSeasonResults(seasonId: string): Promise<SeasonResult[]> {
    try {
      const q = query(collection(db, this.resultsCollection), where('seasonId', '==', seasonId));
      const snapshot = await getDocs(q);
      const results: SeasonResult[] = [];
      snapshot.forEach(docSnap => {
        results.push(docSnap.data() as SeasonResult);
      });
      return results;
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, this.resultsCollection);
    }
  }
}
