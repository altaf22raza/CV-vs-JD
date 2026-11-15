import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  doc,
  getDocFromServer,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Suppress non-fatal WebChannel transport retry warnings while keeping error-level diagnostics active
setLogLevel('error');

function createFirestoreInstance(): Firestore {
  try {
    // Force long-polling to avoid WebChannel chunked 'Listen' stream transport errors behind HTTP/2 proxies & iframes
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
        experimentalLongPollingOptions: { timeoutSeconds: 20 },
        ignoreUndefinedProperties: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

// CRITICAL: Must pass firebaseConfig.firestoreDatabaseId
export const db = createFirestoreInstance();
export const auth = getAuth(app);

// Test connection as instructed by Firebase skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: Client is offline or database initializing.');
    }
  }
}

// Kick off test connection
void testConnection();

export default app;
