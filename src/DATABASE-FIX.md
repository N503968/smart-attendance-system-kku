# Database Relationship Error Fix

## Error Description
```
Error loading student data: {
  "code": "PGRST200",
  "details": "Searched for a foreign key relationship between 'sessions' and 'sections' in the schema 'public', but no matches were found.",
  "hint": null,
  "message": "Could not find a relationship between 'sessions' and 'sections' in the schema cache"
}
```

## Root Cause
The `sessions` table was missing critical columns (`starts_at`, `ends_at`, `require_webauthn`) that the application code was expecting to use.

## Solution Applied

### 1. Updated Database Schema
Added missing columns to the `sessions` table:
- `starts_at TIMESTAMPTZ` - Session start timestamp
- `ends_at TIMESTAMPTZ` - Session end timestamp  
- `require_webauthn BOOLEAN` - Whether biometric auth is required

### 2. Fixed Query Syntax
Updated PostgREST query syntax in multiple components:

**Before:**
```typescript
.select(`
  *,
  session:sessions(
    *,
    section:sections(...)
  )
`)
```

**After:**
```typescript
.select(`
  *,
  sessions!inner(
    *,
    sections!inner(...)
  )
`)
```

### 3. Created Index Optimization
Added indexes for better query performance:
- `idx_sessions_starts_at`
- `idx_sessions_ends_at`

## Files Modified

### Database Schema Files
- ✅ `/supabase-schema.sql` - Complete schema with fixes
- ✅ `/supabase-schema-update.sql` - Update script for existing databases

### Code Files Updated
- ✅ `/components/StudentDashboard.tsx` - Fixed attendance and schedule queries
- ✅ `/components/ActiveSessionsPage.tsx` - Fixed session listing query

## How to Apply the Fix

### For New Installations
Run the complete schema:
```sql
-- Execute /supabase-schema.sql in Supabase SQL Editor
```

### For Existing Databases
Run the update script:
```sql
-- Execute /supabase-schema-update.sql in Supabase SQL Editor
```

## Technical Details

### PostgREST Query Syntax
When using nested relationships in Supabase:
- Use `!inner` for inner joins (required relationships)
- Use table name directly, not `alias:table`
- The foreign key relationship must exist in the database

### Foreign Key Relationships
```sql
-- sessions.section_id → sections.id
CREATE TABLE sessions (
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE
);

-- sections.course_id → courses.id  
CREATE TABLE sections (
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE
);
```

## Verification Steps

1. Check if columns exist:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions' 
AND column_name IN ('starts_at', 'ends_at', 'require_webauthn');
```

2. Verify indexes:
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'sessions';
```

3. Test the relationship query:
```sql
SELECT s.*, sec.name, c.name
FROM sessions s
INNER JOIN sections sec ON s.section_id = sec.id
INNER JOIN courses c ON sec.course_id = c.id
LIMIT 1;
```

## Additional Improvements

### Data Access Pattern Fixes
- Updated nested object access from `record.session?.section?.course` to `record.sessions?.sections?.courses`
- Added proper null checking and fallback values
- Consistent error handling across all queries

### Performance Optimizations
- Added indexes on timestamp columns
- Used `!inner` for required relationships
- Limited query results appropriately

## No Data Loss
✅ All updates are safe and backward compatible
✅ Uses `IF NOT EXISTS` to prevent duplicate column errors
✅ Existing data remains intact

## Support
If you encounter issues:
1. Check Supabase connection settings
2. Verify RLS policies are correctly applied
3. Check browser console for detailed error messages
4. Ensure your Supabase project is active and accessible
