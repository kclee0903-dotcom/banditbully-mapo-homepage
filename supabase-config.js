// Supabase public configuration for the static review system.
// Replace these two values after creating the Supabase project.
// Never put a service_role key or administrator password in this file.
window.BANDIBULI_SUPABASE = {
  url: 'https://YOUR_PROJECT_REF.supabase.co',
  anonKey: 'YOUR_SUPABASE_ANON_KEY',
  reviewImageBucket: 'review-images',
  reviewSubmitCooldownMs: 60 * 1000,
  reviewMinLength: 20
};
