# Integration Questionnaire 1 Answers

**1. Database choice for real-time draft state (Crucial for Auction latency):**
> Firestore (Standard, document-based, easy query but potentially slower for sub-second auction bids).

**2. Authentication requirement:**
> Anonymous Auth (Users just click an invite link and enter a display name, no login required).

**3. Bot Execution Environment (where do the bots run their ONNX models?):**
> Client-side on the Host's browser (Zero server cost but if host disconnects, bots pause until host passes).

**4. Handling Host Disconnection during a live draft (Project.md says 'Host passes to next earliest joiner'):**
> Client-side heartbeat: Next earliest joiner detects host absence and takes over bot execution.

**5. Security Rules vs Client Trust:**
> Strict Backend Validation: Firestore security rules heavily restrict writes, validating every bid amount and slot availability.

**6. Lobby Lifecycle & Cleanup:**
> Ephemeral: Lobbies and draft history auto-delete 24 hours after completion via TTL policy.

**7. Data Model: Squad and Pick Storage:**
> Single Document: The entire draft state and all squads live in one JSON document (easy sync, 1MB limit).

**8. Transitioning from Fake to Real Data:**
> Hard Switch: Strip out all fake simulation timers immediately and wire UI directly to Firebase listeners.

**9. Auction Clock Synchronization:**
> Server Timestamp: Firebase Cloud Functions handle the 15s timer expiration and close the lot.

**10. Data Pre-loading Strategy (Player Pool 546 rows):**
> Client fetches static CSV file from CDN as it does now, then joins it with Firebase player IDs locally.

