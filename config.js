// Spotted config: the only two values a self-hoster changes.
// The anon key is public by design. Row-level security in supabase/schema.sql
// is what protects the data. Never put the service_role key here.
window.SPOTTED_CONFIG = {
  supabaseUrl: 'https://nkcmgcunnrqulocdwgxr.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rY21nY3VubnJxdWxvY2R3Z3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMjc3ODksImV4cCI6MjEwNDcwMzc4OX0.jzOZ7JV1X5mLazg7GBKLhISdK17DaecO8qoooXTAzBc',
};
