/* =====================
   글쓰기 / 글 수정
   ===================== */

import { supabase } from './supabase.js'

/* 이메일에서 @ 앞 아이디 추출 */
const getUsername = (email) => email.split('@')[0]

/* URL 파라미터에서 수정할 게시글 id 확인 */
const params = new URLSearchParams(window.location.search)
const editId = params.get('id')

const init = async () => {
  /* 로그인 확인 */
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    alert('로그인이 필요합니다.')
    window.location.href = 'login.html'
    return
  }

  /* 수정 모드: 기존 내용 불러오기 */
  if (editId) {
    document.querySelector('#write-page-title').textContent = '글 수정'
    document.querySelector('#breadcrumb-action').textContent = '글 수정'
    document.querySelector('#submitBtn').textContent = '수정'

    const { data, error } = await supabase
      .from('posts')
      .select('id, title, content, user_id')
      .eq('id', editId)
      .single()

    if (error || !data) {
      alert('게시글을 찾을 수 없습니다.')
      window.location.href = 'board.html'
      return
    }

    /* 본인 글인지 확인 */
    if (data.user_id !== session.user.id) {
      alert('수정 권한이 없습니다.')
      window.location.href = `post.html?id=${editId}`
      return
    }

    document.querySelector('#postTitle').value = data.title
    document.querySelector('#postContent').value = data.content
  }

  /* 취소 버튼 */
  document.querySelector('#cancelBtn').addEventListener('click', () => {
    history.back()
  })

  /* 폼 제출 */
  document.querySelector('#writeForm').addEventListener('submit', async (e) => {
    e.preventDefault()

    const title = document.querySelector('#postTitle').value.trim()
    const content = document.querySelector('#postContent').value.trim()

    if (!title) { alert('제목을 입력하세요.'); return }
    if (!content) { alert('내용을 입력하세요.'); return }

    const submitBtn = document.querySelector('#submitBtn')
    submitBtn.disabled = true
    submitBtn.textContent = '처리 중...'

    if (editId) {
      /* 수정 */
      const { error } = await supabase
        .from('posts')
        .update({ title, content })
        .eq('id', editId)
        .eq('user_id', session.user.id)

      if (error) {
        alert('수정에 실패했습니다.')
        submitBtn.disabled = false
        submitBtn.textContent = '수정'
        return
      }
      window.location.href = `post.html?id=${editId}`

    } else {
      /* 새 글 등록 */
      const { error } = await supabase
        .from('posts')
        .insert({
          title,
          content,
          author_name: getUsername(session.user.email),
          user_id: session.user.id,
        })

      if (error) {
        alert('글 등록에 실패했습니다.')
        submitBtn.disabled = false
        submitBtn.textContent = '등록'
        return
      }
      window.location.href = 'board.html'
    }
  })
}

init()
