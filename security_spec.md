# Security Specification for CV vs JD

## 1. Data Invariants
- A resume document must belong to the authenticated user (`resource.data.userId == request.auth.uid`).
- Users can only read, write, update, and delete their own resumes, applications, and optimization histories.
- Users can only read, update, and delete their own profile document in `/users/{userId}` where `userId == request.auth.uid`.
- Uploaded binary resume files in Firebase Storage (`/users/{userId}/resumes/{fileId}`) are strictly owner-private, capped at 5 MB, and restricted to document MIME types.
- `GEMINI_API_KEY` and `SESSION_SECRET` reside strictly on the server; client bundles never access API keys or `@google/genai`.
- Batch list queries must be scoped to the authenticated user's ID (`where('userId', '==', auth.currentUser.uid)`).

## 2. Dirty Dozen Payload Matrix
1. Attempt to read another user's resume (`/resumes/{foreignResumeId}`). Result: PERMISSION_DENIED.
2. Attempt to create a resume with a mismatched `userId` (`request.resource.data.userId != request.auth.uid`). Result: PERMISSION_DENIED.
3. Attempt to update a resume belonging to another user. Result: PERMISSION_DENIED.
4. Attempt to change `userId`, `id`, or `createdAt` during an update. Result: PERMISSION_DENIED.
5. Attempt to list all resumes without filtering by `userId == request.auth.uid`. Result: PERMISSION_DENIED.
6. Attempt to write to `/users/{otherUid}` or list `/users`. Result: PERMISSION_DENIED.
7. Attempt to read another user's profile or storage file. Result: PERMISSION_DENIED.
8. Unauthenticated read or write on `/resumes`, `/applications`, `/history`, `/users`, or Storage. Result: PERMISSION_DENIED.
9. Attempt to inject arbitrary extra keys or oversized fields (`title > 200`, `latexSource > 200KB`). Result: PERMISSION_DENIED.
10. Attempt to overwrite or mutate `/history/{historyId}`. Result: PERMISSION_DENIED.
11. Attempt to upload executable binaries (`MZ`, `ELF`, `#!/`) or files > 5 MB. Result: REJECTED client-side and in Storage rules.
12. Attempt to forge or replay an expired/revoked session token. Result: 401 UNAUTHORIZED.
