/* =====================
   로그인 / 회원가입 처리
   ===================== */

import { supabase } from './supabase.js'

// 이메일에서 @ 앞 아이디 추출
const getUsername = (email) => email.split('@')[0]

// 탭 전환
const tabs = document.querySelectorAll('.login-tab')
const panels = document.querySelectorAll('.login-panel')

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('login-tab--active'))
    panels.forEach(p => p.classList.remove('login-panel--active'))
    tab.classList.add('login-tab--active')
    document.querySelector(`.login-panel[data-panel="${tab.dataset.tab}"]`)
      .classList.add('login-panel--active')
    clearError()
  })
})

// 에러 메시지 표시/초기화
const showError = (msg) => {
  const el = document.querySelector('.login-error')
  if (el) { el.textContent = msg; el.style.display = 'block' }
}

const clearError = () => {
  const el = document.querySelector('.login-error')
  if (el) { el.textContent = ''; el.style.display = 'none' }
}

// 로그인
const loginForm = document.querySelector('#form-login')
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault()
  clearError()

  const email    = loginForm.querySelector('[name="email"]').value.trim()
  const password = loginForm.querySelector('[name="password"]').value

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    showError('이메일 또는 비밀번호가 올바르지 않습니다.')
    return
  }

  // 로그인 성공 → 이전 페이지 or 메인으로 이동
  window.location.href = document.referrer || 'index.html'
})

// 회원가입
const signupForm = document.querySelector('#form-signup')
signupForm?.addEventListener('submit', async (e) => {
  e.preventDefault()
  clearError()

  const email    = signupForm.querySelector('[name="email"]').value.trim()
  const password = signupForm.querySelector('[name="password"]').value
  const confirm  = signupForm.querySelector('[name="confirm"]').value

  if (password !== confirm) {
    showError('비밀번호가 일치하지 않습니다.')
    return
  }

  if (password.length < 6) {
    showError('비밀번호는 6자 이상이어야 합니다.')
    return
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: getUsername(email) }
    }
  })

  if (error) {
    showError('회원가입에 실패했습니다. 이미 사용 중인 이메일일 수 있습니다.')
    return
  }

  alert(`${getUsername(email)}님, 가입이 완료되었습니다!\n이메일 인증 후 로그인해 주세요.`)
  window.location.href = 'index.html'
})
