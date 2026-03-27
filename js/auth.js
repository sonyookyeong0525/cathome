/* =====================
   헤더 로그인 상태 연동
   모든 페이지 공통 사용
   ===================== */

import { supabase } from './supabase.js'

// 이메일에서 @ 앞 아이디 추출
const getUsername = (email) => email.split('@')[0]

// 아이콘 SVG 정의
const ICON_PROFILE = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>`

const ICON_LOGOUT = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>`

// 프로필 버튼 UI 업데이트
const updateProfileBtn = (user) => {
  const profileBtn = document.querySelector('.header__icon-btn[aria-label="프로필"]') ||
                     document.querySelector('.header__icon-btn--logged-in')
  if (!profileBtn) return

  if (user) {
    // 로그인 상태: 로그아웃 아이콘으로 교체
    profileBtn.innerHTML = ICON_LOGOUT
    profileBtn.setAttribute('aria-label', '로그아웃')
    profileBtn.classList.add('header__icon-btn--logged-in')
    profileBtn.title = `${getUsername(user.email)} (클릭하여 로그아웃)`

    profileBtn.onclick = async () => {
      if (confirm('로그아웃 하시겠습니까?')) {
        await supabase.auth.signOut()
        window.location.reload()
      }
    }
  } else {
    // 비로그인 상태: 프로필 아이콘으로 복구
    profileBtn.innerHTML = ICON_PROFILE
    profileBtn.setAttribute('aria-label', '프로필')
    profileBtn.classList.remove('header__icon-btn--logged-in')
    profileBtn.title = '로그인'

    profileBtn.onclick = () => {
      window.location.href = 'login.html'
    }
  }
}

// 현재 세션 확인 및 UI 초기화
const initAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  updateProfileBtn(session?.user ?? null)

  // 세션 변경 감지 (로그인/로그아웃 시 자동 반영)
  supabase.auth.onAuthStateChange((_event, session) => {
    updateProfileBtn(session?.user ?? null)
  })
}

initAuth()
