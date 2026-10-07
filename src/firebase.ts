import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDocFromServer, 
  setDoc, 
  updateDoc,
  DocumentReference, 
  SetOptions 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export const app = initializeApp(firebaseConfig);
// Initialize Firestore with ignoreUndefinedProperties to prevent crashes on optional/undefined fields
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Recursively cleans an object to remove undefined properties,
 * ensuring 100% safe execution for all Firestore database write operations.
 */
export function cleanFirestoreData<T extends Record<string, any>>(data: T): T {
  if (!data || typeof data !== 'object') {
    return data;
  }
  const cleaned: Record<string, any> = Array.isArray(data) ? [] : {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
      cleaned[key] = cleanFirestoreData(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

/**
 * Safe setDoc wrapper that cleans data and handles Firestore persistence seamlessly.
 */
export async function safeSetDoc<T extends Record<string, any>>(
  docRef: DocumentReference,
  data: T,
  options?: SetOptions
) {
  const cleaned = cleanFirestoreData(data);
  return options ? setDoc(docRef, cleaned, options) : setDoc(docRef, cleaned);
}

/**
 * Safe updateDoc wrapper that cleans data before sending to Firestore.
 */
export async function safeUpdateDoc<T extends Record<string, any>>(
  docRef: DocumentReference,
  data: T
) {
  const cleaned = cleanFirestoreData(data);
  return updateDoc(docRef, cleaned);
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection on boot per Firebase skill guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export { signInWithPopup, signOut };

