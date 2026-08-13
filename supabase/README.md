# Supabase Workflow

Our database is managed directly via the cloud using the Supabase CLI (Docker is not required).

## Directory Structure
*   **`schema.sql`**: The master blueprint of the live database. **Do not edit manually.** Update this via DBeaver export.
*   **`migrations/`**: Put all **brand new** SQL changes here (e.g., `20260813123000_add_table.sql`).
*   **`old_queries/`**: Archive of old, already-applied queries. For reference only. Do not run these.

---

## 1. Setup (First Time Only)
Before you can push any changes, you must link your local CLI to the live database:
```bash
npx supabase link --project-ref sguegujmoawhtstzsdqs
```
*(You will be prompted to enter the database password).*

---

## 2. Pushing New Changes
When you need to create a new table, policy, or function, follow these exact steps:

1. **Create a file:** Create a new file in the `migrations/` folder. It must start with a 14-digit timestamp (e.g., `20260813123000_add_user_avatars.sql`). Do not use subfolders.
2. **Write SQL:** Write your new code in that file.
3. **Push to Live:** Run the following command in your terminal to execute the code on the live server:
   ```bash
   npx supabase db push
   ```
   *(Supabase tracks the timestamps so it never runs the same file twice).*
4. **Update Schema:** Open DBeaver, connect to the database (using the IPv4 Session Pooler), and run a `--schema-only` backup to overwrite `schema.sql`. This keeps our master blueprint up to date in version control.
