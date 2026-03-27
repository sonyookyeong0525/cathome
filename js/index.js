// 헤더 스크롤 shadow 토글
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 0) {
    header.classList.add('header--scrolled');
  } else {
    header.classList.remove('header--scrolled');
  }
});


/* =====================
   히어로 슬라이더
   ===================== */
const heroTrack = document.querySelector('.hero__track');
const heroSlides = document.querySelectorAll('.hero__slide');
const heroPrev = document.querySelector('.hero__arrow--prev');
const heroNext = document.querySelector('.hero__arrow--next');
const counterCurrent = document.querySelector('.hero__counter-current');

const totalSlides = heroSlides.length;
let currentIndex = 0;
let autoSlideTimer = null;

// 슬라이드 이동
const goToSlide = (index) => {
  // 인덱스 범위 순환 처리
  if (index < 0) index = totalSlides - 1;
  if (index >= totalSlides) index = 0;

  currentIndex = index;
  heroTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
  counterCurrent.textContent = currentIndex + 1;
};

// 자동 슬라이드 시작
const startAutoSlide = () => {
  autoSlideTimer = setInterval(() => {
    goToSlide(currentIndex + 1);
  }, 4000);
};

// 자동 슬라이드 초기화 (수동 조작 시 타이머 리셋)
const resetAutoSlide = () => {
  clearInterval(autoSlideTimer);
  startAutoSlide();
};

// 화살표 버튼 이벤트
heroPrev.addEventListener('click', () => {
  goToSlide(currentIndex - 1);
  resetAutoSlide();
});

heroNext.addEventListener('click', () => {
  goToSlide(currentIndex + 1);
  resetAutoSlide();
});

// 터치/드래그 스와이프
let dragStartX = 0;
const SWIPE_THRESHOLD = 50; // 스와이프 인식 최소 거리(px)

// 터치 이벤트 (모바일)
heroTrack.addEventListener('touchstart', (e) => {
  dragStartX = e.touches[0].clientX;
});

heroTrack.addEventListener('touchend', (e) => {
  const diff = dragStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) < SWIPE_THRESHOLD) return;
  goToSlide(diff > 0 ? currentIndex + 1 : currentIndex - 1);
  resetAutoSlide();
});

// 마우스 드래그 이벤트 (PC)
heroTrack.addEventListener('mousedown', (e) => {
  dragStartX = e.clientX;
});

heroTrack.addEventListener('mouseup', (e) => {
  const diff = dragStartX - e.clientX;
  if (Math.abs(diff) < SWIPE_THRESHOLD) return;
  goToSlide(diff > 0 ? currentIndex + 1 : currentIndex - 1);
  resetAutoSlide();
});

// 초기 실행
startAutoSlide();


/* =====================
   카테고리 탭 전환
   ===================== */
const categoryTabs = document.querySelectorAll('.category__tab');
const categoryPanels = document.querySelectorAll('.category__panel');

categoryTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;

    // 탭 활성 클래스 전환
    categoryTabs.forEach(t => t.classList.remove('category__tab--active'));
    tab.classList.add('category__tab--active');

    // 패널 활성 전환
    categoryPanels.forEach(panel => {
      panel.classList.remove('category__panel--active');
      if (panel.dataset.panel === target) {
        panel.classList.add('category__panel--active');
      }
    });
  });
});


/* =====================
   나캣랭킹 어코디언
   ===================== */
const rankingItems = document.querySelectorAll('.ranking__item');

rankingItems.forEach((item) => {
  const trigger = item.querySelector('.ranking__trigger');

  trigger.addEventListener('click', () => {
    const isActive = item.classList.contains('ranking__item--active');

    // 모든 아이템 닫기
    rankingItems.forEach(i => i.classList.remove('ranking__item--active'));

    // 클릭한 아이템이 닫혀 있었으면 열기
    if (!isActive) {
      item.classList.add('ranking__item--active');
    }
  });
});
