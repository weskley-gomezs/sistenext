import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || undefined);

async function test() {
  try {
    await deleteDoc(doc(db, 'leads', 'nonexistent'));
    console.log("Delete ran without error");
  } catch(e: any) {
    console.error("Delete Error:", e.message);
  }
}
test().then(() => process.exit(0));
