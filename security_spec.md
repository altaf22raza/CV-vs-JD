# Security Specification for ResumeIQ

## 1. Data Invariants
- A resume document must belong to the authenticated user (`resource.data.userId == request.auth.uid`).
- Users can only read, write, update, and delete their own resumes and optimization histories.
- Users can only read and write their own profile document in `/users/{userId}` where `userId == request.auth.uid`.
- Sensitive documents cannot be modified by other users.
- Batch list queries must be scoped to the authenticated user's ID.

## 2. Dirty Dozen Payload Matrix
1. Attempt to read another user's resume (`/resumes/{foreignResumeId}`). Result: PERMISSION_DENIED.
2. Attempt to create a resume with a mismatched `userId` (`request.resource.data.userId != request.auth.uid`). Result: PERMISSION_DENIED.
3. Attempt to update a resume belonging to another user. Result: PERMISSION_DENIED.
4. Attempt to change `userId` during an update. Result: PERMISSION_DENIED.
5. Attempt to list all resumes without filtering by `userId == request.auth.uid`. Result: PERMISSION_DENIED.
6. Attempt to write to `/users/{otherUid}`. Result: PERMISSION_DENIED.
7. Attempt to read another user's profile. Result: PERMISSION_DENIED.
8. Unauthenticated read on `/resumes`. Result: PERMISSION_DENIED.
9. Unauthenticated write on `/resumes`. Result: PERMISSION_DENIED.
10. Unauthenticated read on `/users`. Result: PERMISSION_DENIED.
11. Attempt to inject invalid oversized fields into resume documents. Result: PERMISSION_DENIED.
12. Attempt to overwrite another user's optimization history. Result: PERMISSION_DENIED.
