/* =====================
   Supabase 클라이언트 초기화
   ===================== */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://jxonhnjkxfupjnithxfw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4b25obmpreGZ1cGpuaXRoeGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NjM4NzUsImV4cCI6MjA5MDEzOTg3NX0.E0Ol4dmD82J7q34XIPo5LdA99rR6CarnAmbZeeT4Cek'

// sessionStorage 사용 → 브라우저 탭 닫으면 자동 로그아웃
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
})
