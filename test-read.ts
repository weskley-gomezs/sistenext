import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || undefined);

async function test() {
  const snap = await getDocs(collection(db, 'leads'));
  console.log(`Leads in DB: ${snap.size}`);
  snap.forEach(d => console.log(d.id, d.data().name));
}
test().then(() => process.exit(0));
