# HostelEase Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Identity & Role Integrity**: Users can register only as `'student'` or `'owner'`. Admin privileges cannot be self-assigned and exist strictly via `/admins/{uid}` or bootstrapped verified founder email (`nehakandpal2601@gmail.com` / `neha.0251mba356@dgu.ac.in` with `email_verified == true`).
2. **PII Isolation**: User email, phone, and guardian contact reside strictly inside `/users/{userId}/private/contact`, readable only by the owner (`request.auth.uid == userId`) or an Admin. Public `/users/{userId}` holds zero PII.
3. **Listing Ownership & Verification**: Listings can only be created by verified authenticated users with `ownerId == request.auth.uid`. Non-admin owners cannot self-approve `'Verified'` status on newly submitted listings (unless admin). `ownerId` and `createdAt` are immutable after creation.
4. **Verified User Reviews**: Reviews under `/listings/{listingId}/reviews/{reviewId}` require `request.auth.token.email_verified == true`, `authorId == request.auth.uid`, an existing parent listing (`exists(/databases/.../listings/$(listingId))`), and if `verifiedResident == true` (unless admin), a valid matching `bookingId` owned by `request.auth.uid`.
5. **Booking & Commission Integrity**: Bookings require `studentId == request.auth.uid` on create, an existing `listingId`, and `ownerId` matching the listing's `ownerId`. Terminal statuses (`Completed`, `Cancelled`) cannot be mutated by non-admins.
6. **Temporal & Volumetric Integrity**: All `createdAt`/`updatedAt` timestamps must match `request.time`. All strings and arrays enforce strict `.size()` bounds. All path IDs pass `isValidId()`.

## 2. "Dirty Dozen" Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Self-Assigned Admin Role**: `POST /users/{uid}` with `{ role: "admin" }` -> DENIED (role enum restricted to `['student', 'owner']`).
2. **PII Snooping**: `GET /users/{otherUid}/private/contact` by non-owner -> DENIED.
3. **Unverified Email Review**: `POST /listings/{id}/reviews/{revId}` with `auth.token.email_verified == false` -> DENIED.
4. **Shadow Field Injection on Listing**: `POST /listings/{id}` including `shadowFlag: true` -> DENIED (`keys().hasOnly(...)`).
5. **Owner Spoofing on Listing**: `POST /listings/{id}` with `ownerId: "victim_uid"` -> DENIED (`ownerId == request.auth.uid`).
6. **Fake Verified Resident Review**: `POST /listings/{id}/reviews/{revId}` with `verifiedResident: true, bookingId: ""` by non-admin -> DENIED.
7. **Orphaned Review**: `POST /listings/nonexistent_999/reviews/{revId}` -> DENIED (`exists(listing)`).
8. **Booking Commission Tampering**: `POST /bookings/{id}` with `status: "Confirmed", commissionInr: 0` by student -> DENIED (initial status must be `'Pending Visit'` and `commissionInr == 0` until confirmed).
9. **Post-Terminal Booking Reopen**: `PATCH /bookings/{id}` changing `status: "Completed"` back to `"Pending Visit"` by student/owner -> DENIED.
10. **Blanket Booking List Scraping**: `LIST /bookings` without scoping to `studentId == uid` or `ownerId == uid` -> DENIED (`allow list` evaluates `resource.data`).
11. **Timestamp Forgery**: `POST /serviceOrders/{id}` with `createdAt: "2020-01-01T00:00:00Z"` -> DENIED (`createdAt == request.time`).
12. **ID Poisoning / Resource Exhaustion**: `POST /listings/{1500_char_id}` or `description` > 600 chars -> DENIED (`isValidId()` & `.size()`).
