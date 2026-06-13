# Security Specification & Invariant Mapping

This spec details the strict security constraints, state transition laws, and data integrity safeguards for the Pickleball Club Elo application databases.

## 1. Core Data Invariants & Access Control

1. **Players Collection (`/players/{playerId}`)**:
   - **Identity**: Any user can sign up or view the directory. However, a player is only allowed to modify their own profile details (`name`, `nickname`, `avatar`, `bio`).
   - **System Integrity (ELO & Stats)**: Ratings (`elo`, `peakElo`, `trend`, `wins`, `losses`, `streak`), system statuses (`status`), and authorization variables (`role`) are protected system fields. Only officers/superadmins can set these, or they can be modified as downstream side-effects of validated matches.
   - **Self-Promotion Guard**: Users cannot elevate their own role to `officer` or `superadmin`, nor can they move their account status from `suspended` or `pending` without administrative verification.

2. **Matches Collection (`/matches/{matchId}`)**:
   - **Integrity**: Matches must represent valid matches between registered players.
   - **Access**: Only authenticated users can record completed matches. Deletions or retrospectives are prohibited to ensure rating history is immutable.

3. **Challenges Collection (`/challenges/{challengeId}`)**:
   - **State Transition Flow**: 
     - Draft challenges begin as `pending`.
     - The recipient player can transition it to `accepted` or `declined`.
     - Once accepted, players can report scores, moving the status to `submitted`.
     - The opposing player verified the score, leading to `completed` or `disputed`.
   - **Identity Protection**: Only the specified recipient player can accept/decline or verify/dispute the result. The challenger cannot mark their own reported match as accepted or verified without recipient agreement.

4. **Verifications Collection (`/verifications/{verificationId}`)**:
   - **Admin Only**: System reviews and verifications can only be generated or manipulated by superadmins or officers. Members have read-only access.

5. **Notifications Collection (`/notifications/{notificationId}`)**:
   - **Strict Isolation**: Notifications can only be accessed or modified (e.g. marked read) by the owner of the designated `userId`. No neighbor leaks.

---

## 2. The "Dirty Dozen" Threat Payloads (Hypothetical Attacks)

Here are the 12 specific hostile requests designed to breach integrity, which our firestore rules must mathematically prevent.

1. **Self-Appointed Grandmaster Attack**:
   - *Target*: `/players/unverified_player`
   - *Action*: Create/Update
   - *Payload*: `{"id": "unverified_player", "name": "Hack", "elo": 9999, "role": "superadmin", "status": "active"}`
   - *Result*: **PERMISSION_DENIED** (only system/officers can modify ELO/roles).

2. **Status Hijack Attack**:
   - *Target*: `/players/suspended_player`
   - *Action*: Update (`status` -> `active`)
   - *Payload*: `{"status": "active"}`
   - *Result*: **PERMISSION_DENIED** (only admins can revive suspended player records).

3. **Double-Verify Self-Submitted Match Challenge**:
   - *Target*: `/challenges/chall_abc`
   - *Action*: Update (`statusString` -> `completed` / `verified`) sent by Challenger.
   - *Payload*: `{"statusString": "completed", "winnerId": "challenger"}`
   - *Result*: **PERMISSION_DENIED** (only the defending opponent can verify/approve the reported score).

4. **Junk String ID Exhaustion (Denial of Wallet)**:
   - *Target*: `/players/very_long_junk_string_with_excess_payload_for_id_poisoning`
   - *Action*: Create
   - *Payload*: `{"id": "very_long_junk_string..."}`
   - *Result*: **PERMISSION_DENIED** (ID does not conform to character and size constraints).

5. **Impersonate Score Submitter**:
   - *Target*: `/challenges/chall_abc`
   - *Action*: Update (`submittedById` -> `target_opponent` without being logged in as that user).
   - *Result*: **PERMISSION_DENIED** (submittedById must match the authenticating user).

6. **Notification Query Spoofing**:
   - *Target*: `/notifications/foreign_notif` (where `userId == "victim_id"`)
   - *Action*: Read/Write by attacker.
   - *Result*: **PERMISSION_DENIED** (userId must match the logged-in uid).

7. **Arbitrary Elo Injector**:
   - *Target*: `/players/some_player`
   - *Action*: Update ELO slider.
   - *Payload*: `{"elo": 2800}`
   - *Result*: **PERMISSION_DENIED** (standard user account cannot increment arbitrary ELO directly).

8. **Blanket Collection Scraper**:
   - *Target*: Collection-level `list` query on sensitive details.
   - *Action*: List without owner filters.
   - *Result*: **PERMISSION_DENIED** (Rules mandate that matching query constraints are enforced on list entries).

9. **Ghost Match Injection**:
   - *Target*: `/matches/fake_id`
   - *Action*: Create
   - *Payload*: `{"id": "fake_id", "opponentId": "nonexistent_opponent"}`
   - *Result*: **PERMISSION_DENIED** (Relational sync checks verify opposing competitor exists).

10. **Immutable Field Corruptor**:
    - *Target*: `/players/elena_v`
    - *Action*: Update `joinedYear: 2026` (originally 2022).
    - *Result*: **PERMISSION_DENIED** (immutable registration year).

11. **Time Travel Manipulation**:
    - *Target*: `/challenges/chall_xyz`
    - *Action*: Create challenge with `timestamp` set to a future year or past.
    - *Result*: **PERMISSION_DENIED** (server time verification enforces sync).

12. **Null-Security Sub-resource Leak**:
    - *Target*: Write requests to unconfigured routing collections.
    - *Result*: **PERMISSION_DENIED** (Global safety-net catches and drops wildcard paths).
