# Admin Panel Setup Guide

## Overview
This admin panel allows you to manage users in your Supabase `auth.users` table. The panel includes features to:
- List all users
- Create new users
- Edit user emails
- Delete users

## Prerequisites
1. Supabase project with authentication enabled
2. Admin credentials/service key access

## Setup Steps

### 1. Update Environment Variables
Create or update your `.env.local` file in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
VITE_SUPABASE_SERVICE_KEY=your_service_role_key
```

**To get your keys:**
- Go to Supabase Dashboard → Your Project → Settings → API
- Copy **Project URL** and **anon public key**
- Copy **service_role secret key** (keep this secure!)

### 2. Update supabaseClient.js
The client already uses environment variables, so no changes needed unless you want to add additional configuration.

### 3. Access Control

#### Option A: Simple Authentication (Current Implementation)
The app checks if the user is logged in. Right now, any authenticated user can see the admin panel.

#### Option B: Admin Role Based Access (Recommended for Production)

**In Supabase Dashboard:**
1. Go to Authentication → Users
2. For each admin user, click on them and add custom metadata:
```json
{
  "is_admin": true
}
```

**Then the app will automatically enforce admin-only access.**

#### Option C: Database Role (More Secure)
Create a custom table to manage admins:
```sql
CREATE TABLE admin_users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read admin users" 
  ON admin_users FOR SELECT 
  USING (auth.uid() IN (SELECT id FROM admin_users));
```

### 4. Security Considerations

**IMPORTANT - For Production:**
1. **Never expose your service role key** in client-side code
2. **Backend Implementation**: Create a backend API (Node.js, Python, etc.) that:
   - Accepts authentication tokens
   - Validates admin status
   - Uses service role key on the backend
   - Returns results to frontend

3. **Row-Level Security (RLS)**: Set up proper RLS policies
4. **Rate Limiting**: Add rate limiting to user management endpoints

### 5. Backend Implementation Example (Recommended)

Create an edge function or API endpoint that handles user management:

```javascript
// Example with Node.js/Express
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

app.post('/api/admin/users', async (req, res) => {
  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser(req.token)
  
  // Check if user is admin (implement your check)
  if (!isAdmin(user)) return res.status(403).json({ error: 'Unauthorized' })
  
  // Then use supabaseAdmin to manage users
  const { data, error } = await supabaseAdmin.auth.admin.createUser({...})
  res.json({ data, error })
})
```

### 6. Run the Application

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## Features

### Create User
- Enter email and password
- New user is created with `email_confirm: true` (email doesn't need verification)

### Edit User
- Click "Edit" button on any user
- Update email address
- Updates to metadata can be added

### Delete User
- Click "Delete" button on any user
- Confirmation dialog appears before deletion

### Refresh
- Click "Refresh" button to reload user list from Supabase

## Troubleshooting

**Error: "Cannot read properties of undefined (reading 'admin')"**
- Make sure you're using the service role key in environment variables
- The admin API is only available with service role key

**Users not loading**
- Check Supabase URL and keys in .env.local
- Verify you're authenticated and have admin access
- Check browser console for detailed error messages

**Permission denied errors**
- Ensure your service role key is correct
- Check Supabase RLS policies don't restrict admin operations

## Next Steps

1. Implement proper admin verification (Option B or C above)
2. Move user management to secure backend endpoints
3. Add pagination for large user lists
4. Add user search/filter functionality
5. Add user role assignment
6. Add user metadata editing
7. Add audit logging
