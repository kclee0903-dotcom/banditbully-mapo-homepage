// Supabase public configuration for the static review system.
// Never put a service_role key or administrator password in this file.
window.BANDIBULI_SUPABASE = {
  url: 'https://ieavwqrpallhiwytjckh.supabase.co',
  anonKey: 'sb_publishable_5OzbOCXxrqsjfPf500kIVQ_54E8Ho1j',
  reviewImageBucket: 'review-images',
  reviewRequestTimeoutMs: 8 * 1000,
  reviewSubmitCooldownMs: 60 * 1000,
  reviewMinLength: 20
};
