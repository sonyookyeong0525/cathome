/* =====================
   게시글 상세보기
   ===================== */

import { supabase } from './supabase.js'

/* URL 파라미터에서 게시글 id 확인 */
const params = new URLSearchParams(window.location.search)
const postId = params.get('id')

/* 날짜 포맷 (YYYY.MM.DD) */
const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}

const init = async () => {
  /* id 없으면 목록으로 */
  if (!postId) {
    window.location.href = 'board.html'
    return
  }

  /* 게시글 조회 */
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (error || !post) {
    alert('게시글을 찾을 수 없습니다.')
    window.location.href = 'board.html'
    return
  }

  /* 조회수 +1 업데이트 */
  await supabase
    .from('posts')
    .update({ views: post.views + 1 })
    .eq('id', postId)

  /* 로딩 텍스트 숨김 */
  document.querySelector('#postLoading').style.display = 'none'

  /* 공지 뱃지 */
  if (post.is_notice) {
    document.querySelector('#postBadge').innerHTML = `<span class="badge badge--primary">공지</span>`
  }

  /* 게시글 내용 채우기 */
  document.querySelector('#postTitle').textContent = post.title
  document.querySelector('#postAuthor').textContent = post.author_name
  document.querySelector('#postDate').textContent = formatDate(post.created_at)
  document.querySelector('#postViews').textContent = post.views + 1
  /* 줄바꿈을 <br>로 변환 */
  document.querySelector('#postContent').innerHTML = post.content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')

  /* 헤더 / 본문 표시 */
  document.querySelector('#postHeader').style.display = 'block'
  document.querySelector('#postBody').style.display = 'block'

  /* 페이지 타이틀 업데이트 */
  document.title = `${post.title} — CATHOME`

  /* 로그인한 본인 글이면 수정/삭제 버튼 표시 */
  const { data: { session } } = await supabase.auth.getSession()
  if (session && session.user.id === post.user_id) {
    document.querySelector('#postActions').style.display = 'flex'
  }

  /* 수정 버튼 */
  document.querySelector('#editBtn').addEventListener('click', () => {
    window.location.href = `write.html?id=${postId}`
  })

  /* 삭제 버튼 */
  document.querySelector('#deleteBtn').addEventListener('click', async () => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return

    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', session.user.id)

    if (deleteError) {
      alert('삭제에 실패했습니다.')
      return
    }
    window.location.href = 'board.html'
  })
}

init()
