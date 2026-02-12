# Engineering Notes

## 1. RLS Structure & Validation

### Approach
I implemented a strict Row-Level Security (RLS) model centered around the `org_id` column.
-   **Organizations:** Users can only `SELECT` organizations where they have a matching row in `user_roles`.
-   **Tickets/Comments/Attachments:** All these tables have an `org_id` column. The RLS policy checks if the user is a member of that `org_id`.
    -   `is_org_member(org_id)` function encapsulates this logic to avoid repetition.
-   **RBAC:** I created specific policies for `INSERT`, `UPDATE`, and `DELETE` based on roles (Owner/Admin vs Member vs Viewer).
    -   e.g., "Members and above can create tickets" checks `get_my_org_role(org_id) IN ('member', 'admin', 'owner')`.

### Validation
-   Validated manually by switching users in the Supabase dashboard and attempting to query data from a different `org_id`.
-   Verified via the frontend by logging in as different users and ensuring no cross-org data appears.
-   Used the Supabase Policy Editor to test edge cases (e.g., trying to simple `DELETE` as a Viewer).

## 2. Realtime Subscriptions & Data Leaks

### Problem
Supabase Realtime broadcasts all database changes by default if RLS isn't explicitly applied to the realtime replication stream (OR if the client subscribes to `*`).

### Solution
-   **Channel Filters:** In `useRealtimeTickets.ts`, I subscribe strictly with a filter:
    ```typescript
    supabase.channel(`org-${orgId}-tickets`)
    .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tickets',
        filter: `org_id=eq.${orgId}` // <--- CRITICAL
    })
    ```
-   This ensures the client *only* receives events for the organization they are currently viewing. Even if a malicious user tries to listen to `*`, Supabase's realtime RLS (when enabled/configured) or simply the lack of `org_id` context in the client makes it harder.
-   **Future Improvement:** Enable "Realtime RLS" in Supabase settings to enforce RLS policies on the WebSocket stream itself for maximum security.

## 3. Search Strategy

### Approach
For the 10k+ ticket scale, I opted for **PostgreSQL's native `ilike` and `tsvector` capabilities**.
-   **Current Implementation:** Uses `ilike` for title/description matching.
    -   `title.ilike.%term%,description.ilike.%term%`
-   **Scalability:** For a larger dataset (100k+), `ilike` scanning becomes too slow.
-   **Index Strategy:** `search_vector` column (tsvector) added to `tickets`.
    -   A GIN index on `search_vector` allows for sub-millisecond full-text search.
    -   A database trigger automatically updates `search_vector` whenever `title` or `description` changes.

## 4. Cursor Pagination Design

### Why Cursor?
Offset pagination (`OFFSET 10000`) is performance suicide on large tables because the DB scans and discards rows.

### Design
-   **Cursor Field:** A composite cursor of `(created_at, id)`.
    -   `created_at`: Primary sort order (Newest first).
    -   `id`: Tiekbreaker to ensure stable sort when timestamps match.
-   **Fetching:**
    -   Decode cursor: `created_at, id`.
    -   Query: `WHERE (created_at < cursor_date) OR (created_at = cursor_date AND id < cursor_id)`.
    -   This allows jumping strictly to the "next" set of rows using an index scan.

## 5. Bottlenecks & Future Improvements

### Bottlenecks
1.  **Ticket Counts:** `count: 'exact'` is slow on large tables. I would switch to `count: 'estimated'` or maintain a separate counter table/column.
2.  **Timeline Polling:** Fetching the full timeline on every page load might get heavy. I would implement pagination for comments.
3.  **Presence:** Supabase Presence is ephemeral. If connection drops, state is lost.

### Improvements
-   **Soft Deletes:** Implement `deleted_at` column globally to prevent accidental data loss.
-   **React Query / SWR:** Replace manual `useEffect` fetching with a robust cache manager for better optimistic UI and background revalidation.
-   **Edge Functions:** Move the `createInvite` email sending logic to an Edge Function for better isolation and retries.

## 6. Optimization & Omissions

### What I didn't build
-   **Complex Rich Text Editor:** Used a simple textarea for input to focus on the *workflow* mechanics (RBAC, Realtime) rather than UI complexity.
-   **Email Service Integration:** Invites use a "Copy Link" mechanic (or simulates email logging) because setting up SendGrid/Resend requires external API keys not provided in the scope.
-   **Notifications:** Push notifications/Email alerts for ticket assignments were omitted to focus on the core "Ops Console" realtime experience.

### Why?
These features add significant complexity (external dependencies, state management) that doesn't strictly demonstrate the core engineering challenges of Multi-Tenancy or Realtime data consistency.
