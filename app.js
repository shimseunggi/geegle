// ============================
// 공통 유틸
// ============================
function $(sel) { return document.querySelector(sel); }
function getPointerFromEvent(e) {
  if (typeof e.clientX === 'number') {
    return { clientX: e.clientX, clientY: e.clientY, pageX: e.pageX, pageY: e.pageY };
  }
  const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
  if (t) {
    const pageX = (typeof t.pageX === 'number') ? t.pageX : (t.clientX + window.scrollX);
    const pageY = (typeof t.pageY === 'number') ? t.pageY : (t.clientY + window.scrollY);
    return { clientX: t.clientX, clientY: t.clientY, pageX, pageY };
  }
  return null;
}
function isMobile() { return window.matchMedia('(max-width: 768px)').matches; }

// ============================
// 설정 모달
// ============================
const btnOpenSettings = $('#btn-open-settings');
const btnCloseSettings = $('#btn-close-settings');
const settingsModal = $('#settings-modal');

// footer '지글' + 설명 모달
const aboutOverlay = $('#about-overlay');
const btnGeegleFooter = $('#btn-geegle-footer');
const aboutText = $('#about-text');
const aboutCancel = $('#about-cancel');
const aboutSave = $('#about-save');
const ABOUT_KEY = 'geegle_about_text';

function syncOverlayState(){
  const anyOpen =
    (settingsModal && settingsModal.classList.contains('open')) ||
    (aboutOverlay && aboutOverlay.classList.contains('open'));
  document.body.classList.toggle('settings-active', !!anyOpen);
}

btnOpenSettings.addEventListener('click', () => {
  settingsModal.classList.add('open');
  settingsModal.setAttribute('aria-hidden', 'false');
  if (aboutOverlay.classList.contains('open')) {
    aboutOverlay.classList.remove('open');
    aboutOverlay.setAttribute('aria-hidden', 'true');
  }
  syncOverlayState();
});

function closeModal() {
  settingsModal.classList.remove('open');
  settingsModal.setAttribute('aria-hidden', 'true');
  setTimeout(() => syncOverlayState(), 200);
}
btnCloseSettings.addEventListener('click', closeModal);
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) closeModal();
});

function openAbout(){
  if (settingsModal.classList.contains('open')) {
    settingsModal.classList.remove('open');
    settingsModal.setAttribute('aria-hidden', 'true');
  }
  aboutOverlay.classList.add('open');
  aboutOverlay.setAttribute('aria-hidden', 'false');

  const saved = localStorage.getItem(ABOUT_KEY) || '';
  aboutText.value = saved;

  syncOverlayState();
  setTimeout(() => aboutText.focus(), 0);
}
function closeAbout(){
  aboutOverlay.classList.remove('open');
  aboutOverlay.setAttribute('aria-hidden', 'true');
  syncOverlayState();
}

btnGeegleFooter.addEventListener('click', openAbout);
aboutCancel.addEventListener('click', closeAbout);
aboutSave.addEventListener('click', () => {
  localStorage.setItem(ABOUT_KEY, aboutText.value.trim());
  closeAbout();
});
aboutOverlay.addEventListener('click', (e) => {
  if (e.target === aboutOverlay) closeAbout();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && aboutOverlay.classList.contains('open')) closeAbout();
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

clearBtn.addEventListener('click', () => {
  questionInput.value = '';
  questionInput.focus();
});

// ============================
// 게임 로직
// ============================
const cursor = $('#iron-cursor');
const firePit = $('#fire-pit-container');

// ✅ 입력 포커스 중 인두 커서 숨김(구글 검색창 UX)
questionInput.addEventListener('focus', () => document.body.classList.add('input-active'));
questionInput.addEventListener('blur',  () => document.body.classList.remove('input-active'));

// ✅ 5~1 눈금
const heatGauge = $('#heat-gauge');
const heatGaugeItems = heatGauge ? Array.from(heatGauge.querySelectorAll('span')) : [];

const person = $('#person-container');
const answerBubble = $('#answer-bubble');
const sinnerGroup = $('#sinner-group');

const HEAT_DURATION_MS = 5000;

let isHeated = false;
let heatTimer = null;
let heatCountdownTimer = null;
let heatEndsAt = 0;
let bubbleTimer = null;

function showHeatGauge(remainSec) {
  if (!heatGauge) return;
  heatGauge.classList.add('show');
  heatGaugeItems.forEach(el => {
    el.classList.toggle('active', Number(el.dataset.v) === remainSec);
  });
}

function hideHeatGauge() {
  if (!heatGauge) return;
  heatGauge.classList.remove('show');
  heatGaugeItems.forEach(el => el.classList.remove('active'));
}

function stopHeatTimers() {
  if (heatTimer) { clearTimeout(heatTimer); heatTimer = null; }
  if (heatCountdownTimer) { clearInterval(heatCountdownTimer); heatCountdownTimer = null; }
}

function coolDown() {
  isHeated = false;
  cursor.classList.remove('heated');
  stopHeatTimers();
  hideHeatGauge();
}

// ✅ “숯불에서 떼는 순간”부터 카운트 시작
function startHeatTimer() {
  stopHeatTimers();
  heatEndsAt = Date.now() + HEAT_DURATION_MS;
  showHeatGauge(5);

  heatCountdownTimer = setInterval(() => {
    const remainMs = Math.max(0, heatEndsAt - Date.now());
    const remainS = Math.ceil(remainMs / 1000);
    if (remainS <= 0) coolDown();
    else showHeatGauge(remainS);
  }, 100);

  heatTimer = setTimeout(() => coolDown(), HEAT_DURATION_MS);
}

// ✅ 숯불 위에 “올려두는 동안”은 뜨거운 상태 유지(카운트 X, 눈금 숨김)
function holdHeatOnFire() {
  if (!isHeated) {
    isHeated = true;
    cursor.classList.add('heated');
  }
  stopHeatTimers();
  hideHeatGauge();
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
  bubbleTimer = setTimeout(() => { answerBubble.style.visibility = 'hidden'; }, 2400);

  if (isMobile()) person.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

btnGeegleSearch.addEventListener('click', () => {
  questionInput.blur();
  promptToInterrogate();
});
btnFeelingLucky.addEventListener('click', () => {
  if (!questionInput.value.trim()) {
    const lucky = ["오늘의 운세", "범인은 누구인가", "전하의 뜻", "관아의 비밀", "저잣거리 소문"];
    questionInput.value = lucky[Math.floor(Math.random() * lucky[Math.floor(Math.random() * lucky.length)].length)];
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

// ============================
// 커서 이동 + 충돌체크(raf)
// ============================
let fireRect = null;
function updateFireRect() { fireRect = firePit.getBoundingClientRect(); }
updateFireRect();
window.addEventListener('resize', updateFireRect, { passive: true });
window.addEventListener('scroll', updateFireRect, { passive: true });
window.addEventListener('orientationchange', () => setTimeout(updateFireRect, 50), { passive: true });

const pointer = { active:false, clientX:0, clientY:0, pageX:0, pageY:0, dirty:false };
let inFire = false; // ✅ 이전 프레임의 “숯불 위 여부”

function setCursorPos(clientX, clientY) {
  cursor.style.setProperty('--cx', clientX + 'px');
  cursor.style.setProperty('--cy', clientY + 'px');
  if (cursor.style.visibility !== 'visible') cursor.style.visibility = 'visible';
}

function isInsideFire(clientX, clientY) {
  if (!fireRect) return false;
  return clientX >= fireRect.left && clientX <= fireRect.right && clientY >= fireRect.top && clientY <= fireRect.bottom;
}

function rafLoop() {
  const blocked =
    document.body.classList.contains('settings-active') ||
    document.body.classList.contains('input-active');

  if (!blocked && pointer.dirty) {
    pointer.dirty = false;
    setCursorPos(pointer.clientX, pointer.clientY);

    const nowInFire = isInsideFire(pointer.clientX, pointer.clientY);

    if (nowInFire) {
      // 🔥 숯불 위: 뜨거운 상태 “유지” (카운트 X)
      holdHeatOnFire();
    } else {
      // ✅ 숯불에서 “떼는 순간”: 5초 카운트 시작
      if (inFire && isHeated) startHeatTimer();
    }

    inFire = nowInFire;
  }

  requestAnimationFrame(rafLoop);
}
requestAnimationFrame(rafLoop);

function onPointerMove(e) {
  const blocked =
    document.body.classList.contains('settings-active') ||
    document.body.classList.contains('input-active');
  if (blocked) return;

  if (e.type.startsWith('touch')) {
    if (e.target.closest('#question-input') || e.target.closest('.modal-scroll') || e.target.closest('.about-card')) return;
  }

  const p = getPointerFromEvent(e);
  if (!p) return;

  pointer.active = true;
  pointer.clientX = p.clientX;
  pointer.clientY = p.clientY;
  pointer.pageX = p.pageX;
  pointer.pageY = p.pageY;
  pointer.dirty = true;
}

document.addEventListener('mousemove', onPointerMove, { passive: true });
document.addEventListener('touchmove', onPointerMove, { passive: true });
document.addEventListener('touchstart', onPointerMove, { passive: true });

// 모바일: 탭은 “떼는 순간”과 거의 동일 → 즉시 카운트 시작
firePit.addEventListener('click', () => {
  if (!isMobile()) return;
  if (settingsModal.classList.contains('open') || aboutOverlay.classList.contains('open')) return;
  isHeated = true;
  cursor.classList.add('heated');
  startHeatTimer();
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

function createBurnMark(clientX, clientY) {
  const rect = person.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;

  const mark = document.createElement('div');
  mark.className = 'burn-mark';
  mark.style.left = (localX - 20) + 'px';
  mark.style.top  = (localY - 20) + 'px';

  person.appendChild(mark);
  setTimeout(() => mark.remove(), 8000);
}

// ============================
// 죄인 클릭(지지기)
// ============================
person.addEventListener('click', (e) => {
  if (settingsModal.classList.contains('open') || aboutOverlay.classList.contains('open')) return;

  const targetPart = e.target.closest('.head, .torso, .thigh');
  if (!targetPart) return;

  const question = questionInput.value.trim();

  if (bubbleTimer) { clearTimeout(bubbleTimer); bubbleTimer = null; }

  if (!isHeated) {
    const mock = coldMockery[Math.floor(Math.random() * coldMockery.length)];
    answerBubble.innerText = mock;
    answerBubble.style.visibility = 'visible';
    bubbleTimer = setTimeout(() => { answerBubble.style.visibility = 'hidden'; }, 2200);
    return;
  }

  sinnerGroup.classList.add('pain');

  const p = getPointerFromEvent(e) || {
    clientX: e.clientX,
    clientY: e.clientY,
    pageX: e.clientX + window.scrollX,
    pageY: e.clientY + window.scrollY
  };

  createSmoke(p.pageX, p.pageY);

  answerBubble.style.visibility = 'visible';
  answerBubble.innerText = "으아아악!!!";

  coolDown(); // ✅ 지지면 즉시 식음(카운트도 종료)

  setTimeout(() => { createBurnMark(p.clientX, p.clientY); }, 280);

  setTimeout(() => {
    const pick = question
      ? randomAnswers[Math.floor(Math.random() * randomAnswers.length)]
      : noQuestionAnswers[Math.floor(Math.random() * noQuestionAnswers.length)];

    answerBubble.innerText = pick;

    setTimeout(() => {
      sinnerGroup.classList.remove('pain');
      bubbleTimer = setTimeout(() => { answerBubble.style.visibility = 'hidden'; }, 3200);
    }, 450);
  }, 520);
});

window.addEventListener('load', () => updateFireRect());
