/* =====================
   게시글 상세보기 + 댓글
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

/* ── 댓글 목록 렌더링 ── */
const renderComments = (comments, currentUserId) => {
  const list = document.querySelector('#commentList')
  const empty = document.querySelector('#commentEmpty')
  const countEl = document.querySelector('#commentCount')

  countEl.textContent = comments.length

  if (comments.length === 0) {
    list.innerHTML = ''
    empty.style.display = 'block'
    return
  }

  empty.style.display = 'none'
  list.innerHTML = comments.map(c => {
    const isMine = currentUserId && c.user_id === currentUserId
    return `
      <li class="comment-item" data-id="${c.id}">
        <div class="comment-item__meta">
          <span class="comment-item__author">${c.author_name}</span>
          <span class="comment-item__date">${formatDate(c.created_at)}</span>
          ${isMine ? `<button class="comment-item__delete" data-id="${c.id}" aria-label="댓글 삭제">삭제</button>` : ''}
        </div>
        <p class="comment-item__content">${c.content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>')
        }</p>
      </li>`
  }).join('')

  /* 삭제 버튼 이벤트 */
  list.querySelectorAll('.comment-item__delete').forEach(btn => {
    btn.addEventListener('click', () => deleteComment(parseInt(btn.dataset.id)))
  })
}

/* ── 댓글 조회 ── */
const fetchComments = async (currentUserId) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('댓글 조회 오류:', error)
    return
  }
  renderComments(data, currentUserId)
}

/* ── 댓글 삭제 ── */
const deleteComment = async (commentId) => {
  if (!confirm('댓글을 삭제하시겠습니까?')) return

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    alert('삭제에 실패했습니다.')
    return
  }

  const { data: { session } } = await supabase.auth.getSession()
  fetchComments(session?.user?.id ?? null)
}

/* ── 댓글 작성 초기화 ── */
const initCommentForm = (session) => {
  if (!session) {
    /* 비로그인 안내 표시 */
    document.querySelector('#commentLoginNotice').style.display = 'block'
    return
  }

  document.querySelector('#commentForm').style.display = 'block'

  const textarea = document.querySelector('#commentContent')
  const limitEl = document.querySelector('#commentLimit')
  const submitBtn = document.querySelector('#commentSubmitBtn')

  /* 글자 수 카운터 */
  textarea.addEventListener('input', () => {
    limitEl.textContent = `${textarea.value.length} / 500`
  })

  /* 등록 버튼 */
  submitBtn.addEventListener('click', async () => {
    const content = textarea.value.trim()
    if (!content) { alert('댓글을 입력하세요.'); return }

    submitBtn.disabled = true

    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: parseInt(postId),
        content,
        author_name: session.user.email.split('@')[0],
        user_id: session.user.id,
      })

    submitBtn.disabled = false

    if (error) {
      alert('댓글 등록에 실패했습니다.')
      return
    }

    /* 입력창 초기화 후 목록 갱신 */
    textarea.value = ''
    limitEl.textContent = '0 / 500'
    fetchComments(session.user.id)
  })
}

/* ── 초기화 ── */
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

  /* 조회수 +1 — security definer 함수로 RLS 우회 */
  await supabase.rpc('increment_views', { post_id: parseInt(postId) })

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
  /* Quill이 생성한 HTML을 그대로 렌더링 */
  document.querySelector('#postContent').innerHTML = post.content

  /* 첨부 이미지가 있으면 표시 */
  if (post.image_url) {
    document.querySelector('#postImage').src = post.image_url
    document.querySelector('#postImageWrap').style.display = 'block'
  }

  /* 헤더 / 본문 표시 */
  document.querySelector('#postHeader').style.display = 'block'
  document.querySelector('#postBody').style.display = 'block'

  /* 페이지 타이틀 업데이트 */
  document.title = `${post.title} — CATHOME`

  /* 로그인 상태 확인 */
  const { data: { session } } = await supabase.auth.getSession()
  const currentUserId = session?.user?.id ?? null

  /* 본인 글이면 수정/삭제 버튼 표시 */
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

  /* 댓글 초기화 */
  fetchComments(currentUserId)
  initCommentForm(session)
}

init()
