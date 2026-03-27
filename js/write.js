/* =====================
   글쓰기 / 글 수정 (Quill 에디터)
   ===================== */

import { supabase } from './supabase.js'

/* 이메일에서 @ 앞 아이디 추출 */
const getUsername = (email) => email.split('@')[0]

/* URL 파라미터에서 수정할 게시글 id 확인 */
const params = new URLSearchParams(window.location.search)
const editId = params.get('id')

/* 허용 이미지 타입 / 최대 크기 */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

/* 선택된 파일 상태 */
let selectedFile = null
let existingImageUrl = null

/* ── Quill 에디터 초기화 ── */
const initEditor = () => {
  const quill = new Quill('#quillEditor', {
    theme: 'snow',
    placeholder: '내용을 입력하세요.',
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['clean'],
      ],
    },
  })
  return quill
}

/* ── 이미지 첨부 UI ── */
const initImageUpload = () => {
  const fileInput = document.querySelector('#imageFile')
  const fileName = document.querySelector('#fileName')
  const fileClearBtn = document.querySelector('#fileClearBtn')
  const imagePreview = document.querySelector('#imagePreview')
  const previewImg = document.querySelector('#previewImg')

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('이미지 파일(jpg, png, gif, webp)만 첨부할 수 있습니다.')
      fileInput.value = ''
      return
    }
    if (file.size > MAX_SIZE) {
      alert('파일 크기는 5MB 이하만 첨부할 수 있습니다.')
      fileInput.value = ''
      return
    }

    selectedFile = file
    existingImageUrl = null

    fileName.textContent = file.name
    fileClearBtn.style.display = 'inline-flex'

    const reader = new FileReader()
    reader.onload = (e) => {
      previewImg.src = e.target.result
      imagePreview.style.display = 'block'
    }
    reader.readAsDataURL(file)
  })

  fileClearBtn.addEventListener('click', () => {
    selectedFile = null
    existingImageUrl = null
    fileInput.value = ''
    fileName.textContent = '선택된 파일 없음'
    fileClearBtn.style.display = 'none'
    imagePreview.style.display = 'none'
    previewImg.src = ''
  })
}

/* ── Storage 이미지 업로드 ── */
const uploadImage = async (file, userId) => {
  const ext = file.name.split('.').pop()
  const filePath = `${userId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('post-images')
    .upload(filePath, file)

  if (error) {
    console.error('이미지 업로드 오류:', error)
    return null
  }

  const { data } = supabase.storage
    .from('post-images')
    .getPublicUrl(filePath)

  return data.publicUrl
}

/* ── 초기화 ── */
const init = async () => {
  /* 로그인 확인 */
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    alert('로그인이 필요합니다.')
    window.location.href = 'login.html'
    return
  }

  const quill = initEditor()
  initImageUpload()

  /* 수정 모드: 기존 내용 불러오기 */
  if (editId) {
    document.querySelector('#write-page-title').textContent = '글 수정'
    document.querySelector('#breadcrumb-action').textContent = '글 수정'
    document.querySelector('#submitBtn').textContent = '수정'

    const { data, error } = await supabase
      .from('posts')
      .select('id, title, content, user_id, image_url')
      .eq('id', editId)
      .single()

    if (error || !data) {
      alert('게시글을 찾을 수 없습니다.')
      window.location.href = 'board.html'
      return
    }

    if (data.user_id !== session.user.id) {
      alert('수정 권한이 없습니다.')
      window.location.href = `post.html?id=${editId}`
      return
    }

    document.querySelector('#postTitle').value = data.title

    /* 기존 HTML 내용을 Quill에 로드 */
    quill.clipboard.dangerouslyPasteHTML(data.content)

    if (data.image_url) {
      existingImageUrl = data.image_url
      document.querySelector('#fileName').textContent = '기존 이미지 첨부됨'
      document.querySelector('#fileClearBtn').style.display = 'inline-flex'
      document.querySelector('#previewImg').src = data.image_url
      document.querySelector('#imagePreview').style.display = 'block'
    }
  }

  /* 취소 버튼 */
  document.querySelector('#cancelBtn').addEventListener('click', () => {
    history.back()
  })

  /* 폼 제출 */
  document.querySelector('#writeForm').addEventListener('submit', async (e) => {
    e.preventDefault()

    const title = document.querySelector('#postTitle').value.trim()
    /* Quill 내용이 비어있으면 getText()가 '\n'만 반환 */
    const content = quill.getSemanticHTML()
    const isContentEmpty = quill.getText().trim() === ''

    if (!title) { alert('제목을 입력하세요.'); return }
    if (isContentEmpty) { alert('내용을 입력하세요.'); return }

    const submitBtn = document.querySelector('#submitBtn')
    submitBtn.disabled = true
    submitBtn.textContent = '처리 중...'

    let imageUrl = existingImageUrl

    if (selectedFile) {
      submitBtn.textContent = '이미지 업로드 중...'
      imageUrl = await uploadImage(selectedFile, session.user.id)
      if (!imageUrl) {
        alert('이미지 업로드에 실패했습니다.')
        submitBtn.disabled = false
        submitBtn.textContent = editId ? '수정' : '등록'
        return
      }
    }

    if (editId) {
      const { error } = await supabase
        .from('posts')
        .update({ title, content, image_url: imageUrl })
        .eq('id', editId)
        .eq('user_id', session.user.id)

      if (error) {
        alert('수정에 실패했습니다.')
        submitBtn.disabled = false
        submitBtn.textContent = '수정'
        return
      }

    } else {
      const { error } = await supabase
        .from('posts')
        .insert({
          title,
          content,
          author_name: getUsername(session.user.email),
          user_id: session.user.id,
          image_url: imageUrl,
        })

      if (error) {
        alert('글 등록에 실패했습니다.')
        submitBtn.disabled = false
        submitBtn.textContent = '등록'
        return
      }
    }

    window.location.href = 'board.html'
  })
}

init()
