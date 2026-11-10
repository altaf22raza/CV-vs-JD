import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './config';
import { ResumeVersion } from '../types/resume';

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
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
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function saveResumeToFirestore(resume: ResumeVersion, userId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    console.warn('saveResumeToFirestore skipped: active Firebase Auth user does not match');
    return;
  }
  const path = `resumes/${resume.id}`;
  try {
    const resumeRef = doc(db, 'resumes', resume.id);
    await setDoc(resumeRef, {
      id: resume.id,
      userId: userId,
      title: resume.title,
      targetRole: resume.targetRole,
      companyName: resume.companyName || '',
      cvType: resume.cvType || 'created',
      templateId: resume.templateId || 'template-pm',
      latexSource: resume.latexSource || '',
      originalLatex: resume.originalLatex || '',
      structuredData: resume.structuredData,
      originalStructuredData: resume.originalStructuredData,
      diffItems: resume.diffItems || [],
      atsReport: resume.atsReport || null,
      jdText: resume.jdText || '',
      createdAt: resume.createdAt,
      updatedAt: new Date().toISOString(),
      updatedAtServer: serverTimestamp(),
      isOriginal: !!resume.isOriginal
    });
  } catch (err: any) {
    console.warn('saveResumeToFirestore error:', err?.message || err);
    // Don't crash UI on network or transient error
  }
}

export async function fetchUserResumes(userId: string): Promise<ResumeVersion[]> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    // Return empty list safely when not signed in
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
    return snapshot.docs.map(d => d.data() as ResumeVersion);
  } catch (err: any) {
    console.warn('fetchUserResumes error:', err?.message || err);
    return [];
  }
}

export async function deleteResumeFromFirestore(resumeId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `resumes/${resumeId}`;
  try {
    const resumeRef = doc(db, 'resumes', resumeId);
    await deleteDoc(resumeRef);
  } catch (err: any) {
    console.warn('deleteResumeFromFirestore error:', err?.message || err);
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
  const path = `history/${data.id}`;
  try {
    const historyRef = doc(db, 'history', data.id);
    await setDoc(historyRef, {
      ...data,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
