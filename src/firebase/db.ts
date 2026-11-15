import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './config';
import { ResumeVersion, JobApplication } from '../types/resume';
import { toSafeFirestoreId } from '../utils/id';
import { deduplicateResumeVersions, normalizeStructuredResume } from '../utils/safeStorage';

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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function isPermissionDenied(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return msg.includes('permission-denied') || msg.includes('missing or insufficient permissions');
}

export async function saveResumeToFirestore(resume: ResumeVersion, userId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  const safeId = toSafeFirestoreId(resume.id, 'ver');
  const path = `resumes/${safeId}`;
  try {
    const resumeRef = doc(db, 'resumes', safeId);
    const normalizedData = normalizeStructuredResume(resume.structuredData);
    const normalizedOriginal = normalizeStructuredResume(
      resume.originalStructuredData || resume.structuredData
    );
    await setDoc(resumeRef, {
      id: safeId,
      userId,
      title: (resume.title || 'Untitled Resume').slice(0, 200),
      targetRole: (resume.targetRole || 'Professional').slice(0, 200),
      companyName: (resume.companyName || '').slice(0, 200),
      cvType: resume.cvType || 'created',
      templateId: resume.templateId || 'template-pm',
      language: resume.language || 'en',
      latexSource: (resume.latexSource || '').slice(0, 190000),
      originalLatex: (resume.originalLatex || '').slice(0, 190000),
      structuredData: normalizedData,
      originalStructuredData: normalizedOriginal,
      diffItems: Array.isArray(resume.diffItems) ? resume.diffItems : [],
      identifiedKeywordsToAdd: Array.isArray(resume.identifiedKeywordsToAdd)
        ? resume.identifiedKeywordsToAdd
        : [],
      snapshots: Array.isArray(resume.snapshots) ? resume.snapshots.slice(0, 15) : [],
      atsReport: resume.atsReport || null,
      jdText: (resume.jdText || '').slice(0, 48000),
      createdAt: resume.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedAtServer: serverTimestamp(),
      isOriginal: !!resume.isOriginal,
    });
  } catch (err: unknown) {
    if (isPermissionDenied(err)) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.warn('saveResumeToFirestore error:', err instanceof Error ? err.message : err);
  }
}

export async function fetchUserResumes(userId: string): Promise<ResumeVersion[]> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return [];
  }
  const path = 'resumes';
  try {
    const q = query(
      collection(db, 'resumes'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const raw = snapshot.docs.map((d) => d.data() as ResumeVersion);
    return deduplicateResumeVersions(raw);
  } catch (err: unknown) {
    if (isPermissionDenied(err)) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    console.warn('fetchUserResumes error:', err instanceof Error ? err.message : err);
    return [];
  }
}

export async function deleteResumeFromFirestore(resumeId: string): Promise<void> {
  if (!auth.currentUser) return;
  const safeId = toSafeFirestoreId(resumeId, 'ver');
  const path = `resumes/${safeId}`;
  try {
    const resumeRef = doc(db, 'resumes', safeId);
    await deleteDoc(resumeRef);
  } catch (err: unknown) {
    if (isPermissionDenied(err)) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
    console.warn('deleteResumeFromFirestore error:', err instanceof Error ? err.message : err);
  }
}

export async function saveApplicationToFirestore(app: JobApplication, userId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const safeId = toSafeFirestoreId(app.id, 'app');
  const path = `applications/${safeId}`;
  try {
    const appRef = doc(db, 'applications', safeId);
    await setDoc(appRef, {
      ...app,
      id: safeId,
      userId,
      company: (app.company || 'Company').slice(0, 200),
      role: (app.role || 'Role').slice(0, 200),
      notes: (app.notes || '').slice(0, 5000),
      jdText: (app.jdText || '').slice(0, 48000),
      updatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    if (isPermissionDenied(err)) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.warn('saveApplicationToFirestore error:', err instanceof Error ? err.message : err);
  }
}

export async function fetchUserApplications(userId: string): Promise<JobApplication[]> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return [];
  const path = 'applications';
  try {
    const q = query(
      collection(db, 'applications'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as JobApplication);
  } catch (err: unknown) {
    if (isPermissionDenied(err)) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    console.warn('fetchUserApplications error:', err instanceof Error ? err.message : err);
    return [];
  }
}

export async function deleteApplicationFromFirestore(applicationId: string): Promise<void> {
  if (!auth.currentUser) return;
  const safeId = toSafeFirestoreId(applicationId, 'app');
  const path = `applications/${safeId}`;
  try {
    await deleteDoc(doc(db, 'applications', safeId));
  } catch (err: unknown) {
    if (isPermissionDenied(err)) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
    console.warn('deleteApplicationFromFirestore error:', err instanceof Error ? err.message : err);
  }
}

export async function saveOptimizationHistory(data: {
  id: string;
  userId: string;
  resumeId: string;
  targetRole: string;
  companyName: string;
  scoreBefore: number;
  scoreAfter: number;
}): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== data.userId) return;
  const safeId = toSafeFirestoreId(data.id, 'hist');
  const path = `history/${safeId}`;
  try {
    const historyRef = doc(db, 'history', safeId);
    await setDoc(historyRef, {
      ...data,
      id: safeId,
      targetRole: (data.targetRole || 'Role').slice(0, 200),
      companyName: (data.companyName || '').slice(0, 200),
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveUserRetentionPreference(
  userId: string,
  retentionDays: number
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const path = `users/${userId}`;
  try {
    await setDoc(
      doc(db, 'users', userId),
      {
        uid: userId,
        email: auth.currentUser.email || 'user@example.com',
        retentionDays,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    if (isPermissionDenied(err)) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function fetchUserRetentionPreference(userId: string): Promise<number | null> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return null;
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      const val = snap.data()?.retentionDays;
      return typeof val === 'number' ? val : null;
    }
    return null;
  } catch (err) {
    if (isPermissionDenied(err)) {
      handleFirestoreError(err, OperationType.GET, path);
    }
    return null;
  }
}

/**
 * Privacy deletion: removes all cloud documents owned by the user across resumes, applications, history, and users/{uid}.
 */
export async function deleteAllUserCloudData(userId: string): Promise<{ deletedCount: number }> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return { deletedCount: 0 };
  }
  let deletedCount = 0;

  const collectionsToPurge = ['resumes', 'applications', 'history'] as const;
  for (const colName of collectionsToPurge) {
    const q = query(collection(db, colName), where('userId', '==', userId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(doc(db, colName, d.id));
      deletedCount += 1;
    }
  }

  try {
    await deleteDoc(doc(db, 'users', userId));
    deletedCount += 1;
  } catch {
    // Ignore if user doc was not created yet
  }

  return { deletedCount };
}
