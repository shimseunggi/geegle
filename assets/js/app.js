// ============================
// 공통 유틸
// ============================
function $(sel) { return document.querySelector(sel); }

function getPointerFromEvent(e) {
  // mouse event
  if (typeof e.clientX === 'number') {
    return { clientX: e.clientX, clientY: e.clientY, pageX: e.pageX, pageY: e.pageY };
  }
  // touch event
  const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
  if (t) {
    return { clientX: t.clientX, clientY: t.clientY, pageX: t.pageX, pageY: t.pageY };
  }
  return null;
}

// ============================
// 설정 모달
// ============================
const btnOpenSettings = $('#btn-open-settings');
const btnCloseSettings = $('#btn-close-settings');
const settingsModal = $('#settings-modal');

btnOpenSettings.addEventListener('click', () => {
  settingsModal.classList.add('open');
  document.body.classList.add('settings-active');
});

function closeModal() {
  settingsModal.classList.remove('open');
  setTimeout(() => {
    if (!settingsModal.classList.contains('open')) {
      document.body.classList.remove('settings-active');
    }
  }, 600);
}
btnCloseSettings.addEventListener('click', closeModal);
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) closeModal();
});

// ============================
// 테마
// ============================
const btnAuto = $('#btn-auto');
const btnLight = $('#btn-light');
const btnDark = $('#btn-dark');
const themeButtons = [btnAuto, btnLight, btnDark];

function setTheme(mode) {
  themeButtons.forEach(btn => btn.classList.remove('active'));
  if (mode === 'auto') btnAuto.classList.add('active');
  else if (mode === 'light') btnLight.classList.add('active');
  else btnDark.classList.add('active');

  if (mode === 'auto') {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isSystemDark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  } else {
    if (mode === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  }
}
setTheme('auto');
btnAuto.addEventListener('click', () => setTheme('auto'));
btnLight.addEventListener('click', () => setTheme('light'));
btnDark.addEventListener('click', () => setTheme('dark'));
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (btnAuto.classList.contains('active')) setTheme('auto');
});

// ============================
// 검색 UI
// ============================
const questionInput = $('#question-input');
const btnGeegleSearch = $('#btn-geegle-search');
const btnFeelingLucky = $('#btn-feeling-lucky');
const clearBtn = $('.clear-btn');

// ============================
// 게임 로직
// ============================
const cursor = $('#iron-cursor');
const firePit = $('#fire-pit-container');
// ============================
// 모바일 화로 UX 요소(라벨/배지/펄스) 생성
// ============================
const firePitWrapper = firePit.closest('.item-wrapper');

const fireHint = document.createElement('div');
fireHint.className = 'fire-hint';
fireHint.textContent = '화로 탭해서 달구기';
firePitWrapper.appendChild(fireHint);

const heatBadge = document.createElement('div');
heatBadge.className = 'heat-badge';
heatBadge.textContent = '달궈짐 15s';
firePitWrapper.appendChild(heatBadge);

const firePulse = document.createElement('div');
firePulse.className = 'firepit-pulse';
firePitWrapper.appendChild(firePulse);

function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches;
}

// 힌트는 “처음 접속”에만 보여주고, 한 번 화로를 쓰면 저장 후 숨김
const HINT_KEY = 'geegle_fire_hint_seen';
function showFireHintIfNeeded() {
  if (!isMobile()) return;
  const seen = localStorage.getItem(HINT_KEY) === '1';
  if (!seen) fireHint.classList.add('show');
}
function markHintSeen() {
  localStorage.setItem(HINT_KEY, '1');
  fireHint.classList.remove('show');
}

showFireHintIfNeeded();
window.addEventListener('resize', showFireHintIfNeeded);

const person = $('#person-container');
const answerBubble = $('#answer-bubble');
const sinnerGroup = $('#sinner-group');

let isHeated = false;
let heatTimer = null;
let heatCountdownTimer = null;
let heatEndsAt = 0;
let bubbleTimer = null;

function stopHeatUI() {
  heatBadge.classList.remove('show');
  firePulse.classList.add('on'); // 다시 유도 펄스 ON(모바일에서만 의미)
  if (heatCountdownTimer) {
    clearInterval(heatCountdownTimer);
    heatCountdownTimer = null;
  }
}

function startHeatTimer() {
  if (heatTimer) clearTimeout(heatTimer);

  // ✅ 끝나는 시각 기록
  heatEndsAt = Date.now() + 15000;

  // UI 표시
  if (isMobile()) {
    heatBadge.classList.add('show');
    firePulse.classList.remove('on');
  }

  // 1초마다 카운트다운 업데이트
  if (heatCountdownTimer) clearInterval(heatCountdownTimer);
  heatCountdownTimer = setInterval(() => {
    const remainMs = Math.max(0, heatEndsAt - Date.now());
    const remainS = Math.ceil(remainMs / 1000);
    heatBadge.textContent = `달궈짐 ${remainS}s`;
    if (remainMs <= 0) {
      clearInterval(heatCountdownTimer);
      heatCountdownTimer = null;
    }
  }, 250);

  // 15초 지나면 식힘
  heatTimer = setTimeout(() => {
    isHeated = false;
    cursor.classList.remove('heated');
    stopHeatUI();
  }, 15000);
}


function heatUp() {
  if (!isHeated) {
    isHeated = true;
    cursor.classList.add('heated');
  }
  startHeatTimer();
}

const randomAnswers = [
  "으악!! 제.. 제가 그랬습니다요!!",
  "억울합니다!! 저잣거리 김씨가 범인이라니까요!",
  "그건.. 옆집 개똥이가 알지도 모릅니다.. 으윽!",
  "아이고 나 죽네!! 살려만 주시면 다 불겠습니다!!",
  "사실.. 제가 곶감 하나 훔쳐 먹긴 했습니다..!!",
  "그건 관아에 가서 물어보셔야지요! 아악!",
  "뜨거워!! 제발 그 인두 좀 치워주십시오!!",
  "저는 그저 시키는 대로 했을 뿐입니다요! ㅠㅠ",
  "배가 고파서 정신이.. 으아악!!",
  "기억이 날 듯 말 듯 합니다... 한 번만 봐주십시오!"
];

const noQuestionAnswers = [
  "아니, 묻지도 않고 지지는 법이 어디 있소!!",
  "무.. 무엇을 불라는 겁니까요!! 으악!",
  "이유나 알고 맞읍시다 나으리!!",
  "심심해서 지지시는 겁니까!! 너무하오!!",
  "질문이 없는데 대답을 어찌 하오리까!!",
  "그냥 제가 다 잘못했습니다요!! (근데 뭘?)",
  "악!! 살려주시오! 묻는 건 다 말하리다!!",
  "아이쿠 뜨거!! 사람 살려!!",
  "일단 지지고 보는 겁니까요? 억울하옵니다!!",
  "말할 틈은 주셔야지요!! 으아아!!"
];

const coldMockery = [
  "하나도 안 뜨겁사옵니다! 헤헤.",
  "화로에 불은 떼고 오신 겁니까?",
  "간지럽사옵니다 나으리~",
  "식은 인두로는 어림도 없습니다요!",
  "아이고~ 시원~하다!",
  "겁주려거든 제대로 달궈오셔야지요!",
  "지금 장난하십니까요? ㅋㅋ",
  "어이쿠, 차가워라!"
];

function promptToInterrogate() {
  answerBubble.innerText = "질문을 적었으면… 인두를 달궈 죄인을 지지시오!";
  answerBubble.style.visibility = 'visible';

  if (bubbleTimer) clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => {
    answerBubble.style.visibility = 'hidden';
  }, 3500);

  person.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

btnGeegleSearch.addEventListener('click', () => {
  questionInput.blur();
  promptToInterrogate();
});
btnFeelingLucky.addEventListener('click', () => {
  if (!questionInput.value.trim()) {
    const lucky = ["오늘의 운세", "범인은 누구인가", "전하의 뜻", "관아의 비밀", "저잣거리 소문"];
    questionInput.value = lucky[Math.floor(Math.random() * lucky.length)];
  }
  questionInput.blur();
  promptToInterrogate();
});
questionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    promptToInterrogate();
  }
});
clearBtn.addEventListener('click', () => {
  questionInput.value = '';
  questionInput.focus();
});

// ============================
// 커서 이동 + 화로 충돌 체크
// (✅ fixed 화로에서도 정확히 동작하도록 client 좌표 기준)
// ============================
function moveIron(pageX, pageY) {
  if (cursor.style.visibility !== 'visible') cursor.style.visibility = 'visible';
  cursor.style.left = (pageX - 10) + 'px';
  cursor.style.top  = (pageY - 10) + 'px';
}

function checkHeatCollision(clientX, clientY) {
  const rect = firePit.getBoundingClientRect(); // viewport 좌표
  const inside =
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom;

  if (inside) heatUp();
  // 처음엔 “달구기” 유도 펄스 ON
if (isMobile()) firePulse.classList.add('on');

}

document.addEventListener('mousemove', (e) => {
  if (document.body.classList.contains('settings-active')) return;
  moveIron(e.pageX, e.pageY);
  checkHeatCollision(e.clientX, e.clientY);
});

document.addEventListener('touchmove', (e) => {
  if (document.body.classList.contains('settings-active')) return;
  if (e.target.closest('#question-input') || e.target.closest('.modal-scroll')) return;
  const p = getPointerFromEvent(e);
  if (!p) return;
  moveIron(p.pageX, p.pageY);
  checkHeatCollision(p.clientX, p.clientY);
}, { passive: true });

document.addEventListener('touchstart', (e) => {
  if (document.body.classList.contains('settings-active')) return;
  if (e.target.closest('#question-input') || e.target.closest('.modal-scroll')) return;
  const p = getPointerFromEvent(e);
  if (!p) return;
  moveIron(p.pageX, p.pageY);
  checkHeatCollision(p.clientX, p.clientY);
}, { passive: true });

// 화로에 마우스 진입해도 달궈짐(PC)
firePit.addEventListener('mouseenter', () => { heatUp(); });
// ✅ 모바일: 화로 탭하면 즉시 달궈짐 (커서 이동 없이도 OK)
firePit.addEventListener('click', (e) => {
  if (!isMobile()) return; // PC는 기존 방식 유지
  if (settingsModal.classList.contains('open')) return;

  heatUp();
  markHintSeen();

  // 살짝 “툭” 피드백 느낌(시각)
  firePitWrapper.style.transform = 'scale(0.56)';
  setTimeout(() => { firePitWrapper.style.transform = 'scale(0.55)'; }, 120);
});

// ============================
// 연기 + 화상자국
// ============================
function createSmoke(pageX, pageY) {
  const particleCount = 15;
  for (let i = 0; i < particleCount; i++) {
    setTimeout(() => {
      const particle = document.createElement('div');
      particle.className = 'smoke-particle';
      const size = (Math.random() * 15 + 15) + 'px';
      particle.style.width = size;
      particle.style.height = size;
      const offsetX = (Math.random() - 0.5) * 40;
      const offsetY = (Math.random() - 0.5) * 20;
      particle.style.left = (pageX + offsetX) + 'px';
      particle.style.top  = (pageY + offsetY) + 'px';
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 2500);
    }, i * 40);
  }
}

const BURN_LIFETIME_MS = 8000; // CSS burnFadeOut 8s와 맞춤

function createBurnMark(clientX, clientY) {
  // 죄인 컨테이너 안에 박아야 "몸에 남는" 느낌
  const rect = person.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;

  const mark = document.createElement('div');
  mark.className = 'burn-mark';
  mark.style.left = (localX - 20) + 'px';
  mark.style.top  = (localY - 20) + 'px';

  person.appendChild(mark);
  setTimeout(() => mark.remove(), BURN_LIFETIME_MS);
}

// ============================
// 죄인 클릭 (지지기)
// ============================
person.addEventListener('click', (e) => {
  if (settingsModal.classList.contains('open')) return;

  const targetPart = e.target.closest('.head, .torso, .thigh');
  if (!targetPart) return;

  const question = questionInput.value.trim();

  if (bubbleTimer) { clearTimeout(bubbleTimer); bubbleTimer = null; }

  if (!isHeated) {
    const mock = coldMockery[Math.floor(Math.random() * coldMockery.length)];
    answerBubble.innerText = mock;
    answerBubble.style.visibility = 'visible';
    bubbleTimer = setTimeout(() => { answerBubble.style.visibility = 'hidden'; }, 6000);
    return;
  }

  sinnerGroup.classList.add('pain');

  // 포인터 좌표
  const p = getPointerFromEvent(e) || { clientX: e.clientX, clientY: e.clientY, pageX: e.pageX, pageY: e.pageY };

  createSmoke(p.pageX, p.pageY);

  answerBubble.style.visibility = 'visible';
  answerBubble.innerText = "으아아악!!!";

  // ✅ 인두가 먼저 식는다(떨어짐 표현) + 15초 타이머 중단
  isHeated = false;
  cursor.classList.remove('heated');
  if (heatTimer) { clearTimeout(heatTimer); heatTimer = null; }

  stopHeatUI();

  // ✅ 떨어진 뒤 화상자국 (시간 지나면 사라짐)
  setTimeout(() => {
    createBurnMark(p.clientX, p.clientY);
  }, 400);

  setTimeout(() => {
    const pick = question
      ? randomAnswers[Math.floor(Math.random() * randomAnswers.length)]
      : noQuestionAnswers[Math.floor(Math.random() * noQuestionAnswers.length)];

    answerBubble.innerText = pick;

    setTimeout(() => {
      sinnerGroup.classList.remove('pain');

      if (bubbleTimer) clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => { answerBubble.style.visibility = 'hidden'; }, 5000);
    }, 500);
  }, 500);
});
