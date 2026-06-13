import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';
import config from '../firebase-applet-config.json';

const app = initializeApp(config);
// Use (default) — no databaseId
const db = getFirestore(app);

const COLLECTIONS = ['players', 'matches', 'challenges', 'verifications', 'notifications'];

async function main() {
  for (const name of COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, name));
      const count = snap.docs.length;
      console.log(`${name}: ${count} docs`);
      if (count === 0) continue;
      snap.docs.forEach(d => console.log(`  ${d.id}:`, JSON.stringify({...d.data()}).slice(0, 120)));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      console.log(`  deleted ${count}`);
    } catch (e: any) {
      console.log(`${name}: error - ${e?.message || e}`);
    }
  }
}

main().then(() => console.log('done'));
