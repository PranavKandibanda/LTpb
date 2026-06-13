import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import config from '../firebase-applet-config.json';

const app = initializeApp(config);
const db = getFirestore(app);

const COLLECTIONS = ['players', 'matches', 'challenges', 'verifications', 'notifications', 'audit_logs'];

async function main() {
  for (const name of COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, name));
      if (snap.docs.length > 0) {
        console.log(`(default) → ${name}: ${snap.docs.length} docs`);
        snap.docs.forEach(d => console.log(`  ${d.id}:`, JSON.stringify({...d.data()}).slice(0, 200)));
      } else {
        console.log(`(default) → ${name}: 0 docs`);
      }
    } catch (e: any) {
      console.log(`(default) → ${name}: ${e?.message || e}`);
    }
  }
  console.log('done');
}

main();
