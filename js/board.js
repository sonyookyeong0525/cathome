/* =====================
   게시판 목록 — Supabase 연동
   ===================== */

import { supabase } from './supabase.js'

const POSTS_PER_PAGE = 10
let currentPage = 1
let totalCount = 0
let searchKeyword = ''

/* 날짜 포맷 (YYYY.MM.DD) */
const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}

/* 조회수 아이콘 SVG */
const EYE_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
  <circle cx="12" cy="12" r="3"/>
</svg>`

/* 첨부 아이콘 SVG */
const ATTACH_ICON = `<svg class="board-table__attach-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" title="이미지 첨부">
  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
</svg>`

/* 댓글 아이콘 SVG */
const COMMENT_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
</svg>`

/* 게시글 행 HTML 생성 */
const createRowHTML = (post) => {
  const attachIcon = post.image_url ? ATTACH_ICON : ''
  const commentCount = post.comments?.[0]?.count ?? 0
  const commentBadge = commentCount > 0
    ? `<span class="board-table__comment-count">[${commentCount}]</span>`
    : ''

  if (post.is_notice) {
    return `
      <tr class="board-table__row board-table__row--notice">
        <td><span class="badge badge--primary">공지</span></td>
        <td class="board-table__title-cell">
          <a href="post.html?id=${post.id}">${post.title}</a>${commentBadge}${attachIcon}
        </td>
        <td>${post.author_name}</td>
        <td>${formatDate(post.created_at)}</td>
        <td><span class="board-table__views-wrap">${EYE_ICON}${post.views}</span></td>
      </tr>`
  }
  return `
    <tr class="board-table__row">
      <td>${post.id}</td>
      <td class="board-table__title-cell">
        <a href="post.html?id=${post.id}">${post.title}</a>${commentBadge}${attachIcon}
      </td>
      <td>${post.author_name}</td>
      <td>${formatDate(post.created_at)}</td>
      <td><span class="board-table__views-wrap">${EYE_ICON}${post.views}</span></td>
    </tr>`
}

/* Supabase에서 게시글 조회 */
const fetchPosts = async () => {
  const from = (currentPage - 1) * POSTS_PER_PAGE
  const to = from + POSTS_PER_PAGE - 1

  let query = supabase
    .from('posts')
    .select('*, comments(count)', { count: 'exact' })
    .order('is_notice', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (searchKeyword) {
    query = query.ilike('title', `%${searchKeyword}%`)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('게시글 조회 오류:', error)
    return { data: [], count: 0 }
  }
  return { data, count }
}

/* 목록 렌더링 */
const renderPosts = async () => {
  const tbody = document.querySelector('.board-table tbody')
  const countEl = document.querySelector('.board-meta__count strong')

  tbody.innerHTML = `<tr><td colspan="5" class="board-status-cell">불러오는 중...</td></tr>`

  const { data, count } = await fetchPosts()
  totalCount = count ?? 0
  countEl.textContent = totalCount

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="board-status-cell">등록된 게시글이 없습니다.</td></tr>`
    renderPagination()
    return
  }

  tbody.innerHTML = data.map(createRowHTML).join('')
  renderPagination()
}

/* 페이지네이션 렌더링 */
const renderPagination = () => {
  const pagination = document.querySelector('.pagination')
  const totalPages = Math.max(1, Math.ceil(totalCount / POSTS_PER_PAGE))

  /* 현재 그룹 내 시작/끝 페이지 계산 */
  const groupSize = 10
  const currentGroup = Math.ceil(currentPage / groupSize)
  const startPage = (currentGroup - 1) * groupSize + 1
  const endPage = Math.min(startPage + groupSize - 1, totalPages)

  let html = `
    <button class="pagination__btn" data-page="1" aria-label="처음">«</button>
    <button class="pagination__btn" data-page="${Math.max(1, currentPage - 1)}" aria-label="이전">‹</button>`

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="pagination__btn ${i === currentPage ? 'pagination__btn--active' : ''}" data-page="${i}">${i}</button>`
  }

  html += `
    <button class="pagination__btn" data-page="${Math.min(totalPages, currentPage + 1)}" aria-label="다음">›</button>
    <button class="pagination__btn" data-page="${totalPages}" aria-label="끝">»</button>`

  pagination.innerHTML = html

  pagination.querySelectorAll('.pagination__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page)
      if (page !== currentPage) {
        currentPage = page
        renderPosts()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  })
}

/* 글쓰기 버튼 — 로그인 확인 */
const initWriteBtn = () => {
  const writeBtn = document.querySelector('.board-meta__write')
  writeBtn.addEventListener('click', async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert('로그인이 필요합니다.')
      window.location.href = 'login.html'
      return
    }
    window.location.href = 'write.html'
  })
}

/* 검색 */
const initSearch = () => {
  const searchBtn = document.querySelector('.board-search__btn')
  const searchInput = document.querySelector('.board-search__input')

  const doSearch = () => {
    searchKeyword = searchInput.value.trim()
    currentPage = 1
    renderPosts()
  }

  searchBtn.addEventListener('click', doSearch)
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch()
  })
}

/* 초기화 */
const init = () => {
  renderPosts()
  initWriteBtn()
  initSearch()
}

init()
