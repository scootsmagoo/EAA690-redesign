# DATABASE_URL Reference

**IMPORTANT: Keep this file for reference. Do NOT commit passwords to git.**

## Current Supabase Connection String Format

```
postgresql://postgres.qgywoqfpybtbpqrnrlke:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## Current Password (as of 2025-12-27)

**Password:** `3jFPhH9oVrtYOc2W`

## Complete Connection String

```
postgresql://postgres.qgywoqfpybtbpqrnrlke:3jFPhH9oVrtYOc2W@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## Where to Update

1. **Vercel Environment Variables:**
   - Go to: https://vercel.com/adams-projects-253473d1/eaa-690-redesign/settings/environment-variables
   - Find `DATABASE_URL`
   - Click "Edit" or the menu (three dots)
   - Update the value with the complete connection string above
   - Save and redeploy

2. **Local Development (.env.local):**
   - Create/update `.env.local` in the project root
   - Add: `DATABASE_URL=postgresql://postgres.qgywoqfpybtbpqrnrlke:3jFPhH9oVrtYOc2W@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

## Connection String Components

- **Host:** `aws-0-us-east-1.pooler.supabase.com`
- **Port:** `6543` (Connection Pooler)
- **Database:** `postgres`
- **User:** `postgres.qgywoqfpybtbpqrnrlke`
- **Password:** `3jFPhH9oVrtYOc2W` (current as of 2025-12-27)

## If Password Changes Again

1. Reset password in Supabase: https://supabase.com/dashboard/project/qgywoqfpybtbpqrnrlke/database/settings
2. Update this file with the new password
3. Update Vercel environment variable
4. Update local `.env.local` if needed
5. Redeploy on Vercel

