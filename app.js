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

function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function geegleOneLinerAnswer(q) {
  const t = String(q || '').trim();

  if (/(날씨|weather|비|눈|맑|흐리|춥|덥)/i.test(t)) {
    return pickOne([
      "오늘 날씨는 좋습니다요.",
      "오늘은 대체로 맑사옵니다요.",
      "바람이 좀 있사오나 무리는 없사옵니다요.",
      "비가 올 듯하니 우산을 챙기시옵소서."
    ]);
  }

  return pickOne([
    "옳사옵니다요.",
    "그리 하시옵소서요.",
    "무리 없사옵니다요.",
    "그렇사옵니다요."
  ]);
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

// footer '지글' 버튼 클릭 시 열 사이트 (원하는 URL로 바꿔주세요)
const GEEGLE_FOOTER_URL = 'https://github.com/shimseunggi/geegle/'; // ✅ 여기만 원하는 사이트로 수정

if (btnGeegleFooter) {
  btnGeegleFooter.addEventListener('click', () => {
    // ✅ 새 탭으로 열기 (가장 안전 / 사이트 임베드 제한 없음)
    window.open(GEEGLE_FOOTER_URL, '_blank', 'noopener,noreferrer');

    // ✅ 같은 탭으로 이동하고 싶으면 위 줄 대신 이 줄 사용:
    // window.location.href = GEEGLE_FOOTER_URL;
  });
}

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

const brandIron = $('#brand-iron');

function setBrandHeat(on) {
  if (!brandIron) return;
  brandIron.classList.toggle('heated', !!on);
}


const firePit = $('#fire-pit-container');

// ✅ 입력 포커스 중 인두 커서 숨김(구글 검색창 UX)
questionInput.addEventListener('focus', () => document.body.classList.add('input-active'));
questionInput.addEventListener('blur',  () => document.body.classList.remove('input-active'));

// ✅ 항아리 카운트(5→1) : 숫자 1개만 표시
const heatGauge = $('#heat-gauge');
const heatGaugeNum = $('#heat-gauge-num');
let lastGaugeSec = null;

const person = $('#person-container');
const answerBubble = $('#answer-bubble');
const answerLinks = $('#answer-links');
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
  if (!heatGaugeNum) return;

// ✅ 100ms 루프에서 매번 튀지 않게, "초"가 바뀔 때만 갱신
  if (lastGaugeSec !== remainSec) {
    lastGaugeSec = remainSec;
    heatGaugeNum.textContent = String(remainSec);

    heatGaugeNum.classList.remove('bump');
    // reflow 트릭: 같은 클래스 재적용 시 애니메이션 재생
    void heatGaugeNum.offsetWidth;
    heatGaugeNum.classList.add('bump');
  }
}

// ✅ Google-ish progress bar용(1 → 0)
function setHeatProgress(remainMs) {
  if (!heatGauge) return;
  const p = Math.max(0, Math.min(1, remainMs / HEAT_DURATION_MS));
  heatGauge.style.setProperty('--heat-progress', String(p));
}

function hideHeatGauge() {
  if (!heatGauge) return;
  heatGauge.classList.remove('show');
  lastGaugeSec = null;
  heatGauge.style.removeProperty('--heat-progress');
}

function stopHeatTimers() {
  if (heatTimer) { clearTimeout(heatTimer); heatTimer = null; }
  if (heatCountdownTimer) { clearInterval(heatCountdownTimer); heatCountdownTimer = null; }
}

function coolDown() {
  isHeated = false;
  cursor.classList.remove('heated');
  setBrandHeat(false);        // ✅ 추가
  stopHeatTimers();
  hideHeatGauge();
}

// ✅ “숯불에서 떼는 순간”부터 카운트 시작
function startHeatTimer() {
  stopHeatTimers();
  heatEndsAt = Date.now() + HEAT_DURATION_MS;
  showHeatGauge(5);
  setHeatProgress(HEAT_DURATION_MS);

  heatCountdownTimer = setInterval(() => {
    const remainMs = Math.max(0, heatEndsAt - Date.now());
    const remainS = Math.ceil(remainMs / 1000);
    setHeatProgress(remainMs);
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
  setBrandHeat(true);         // ✅ 추가 (카운트 중에도 계속 뜨거운 상태 유지)
  stopHeatTimers();
  hideHeatGauge();
}

// ✅ B버전: API 없이(=로컬 룰 기반) ‘엘리자’ 느낌의 “요약→즉답→근거(검색 링크)”
// - 정확한 수치/최신정보는 단정하지 않고, 대신 “어디서 확인할지”를 명확히 안내
// - 말투는 조선시대 문답(나으리/전하/아뢰옵니다) 컨셉

const fallbackAnswers = [
  "소인, 이 일은 대개 ‘조건’에 따라 갈리옵니다.",
  "하문하신 바는 알겠사오나, 확답은 ‘공식 기록’이 더 정확하옵니다.",
  "한 줄로 말하자면: 핵심 기준 1~2개만 잡으면 풀리옵니다.",
  "정리해 아뢰면, 먼저 ‘정의/범위’를 확정하고 그다음 ‘절차’를 따르시면 되옵니다."
];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeQuestion(q) {
  return String(q || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTopic(q) {
  const s = normalizeQuestion(q).replace(/[?？!！.]/g, ' ').trim();
  if (!s) return '';
  const m = s.match(/(.+?)(의미|뜻|정의|뭐야|무슨|어떤|왜|어떻게|방법|차이|비교|추천|가능|되나|될까)/);
  const t = (m && m[1] ? m[1] : s).trim();
  return t.length > 24 ? (t.slice(0, 24) + '…') : t;
}

function detectType(q) {
  const s = normalizeQuestion(q);
  if (!s) return 'empty';
  if (/(정의|뜻|의미|무슨 뜻|무슨 의미|뭐야|무엇)/.test(s)) return 'definition';
  if (/(어떻게|방법|하는 법|절차|순서|설치|세팅|설정|구성)/.test(s)) return 'howto';
  if (/(차이|비교|vs|중에|중 뭐가|어느 게|어떤 게 더)/i.test(s)) return 'compare';
  if (/(추천|고를까|선택|뭐가 좋아|뭐가 나아)/.test(s)) return 'recommend';
  if (/(가능|되나|될까|할 수|해도 돼)/.test(s)) return 'feasibility';
  if (/(왜|이유|원인|때문)/.test(s)) return 'why';
  if (/(몇|얼마|수치|칼로리|kcal|가격|비용|원|g|그램|kg|cm|%|퍼센트)/i.test(s)) return 'number';
  return 'general';
}

function isTimeOrFactSensitive(q) {
  const s = normalizeQuestion(q);
  return /(오늘|지금|현재|최신|요즘|이번|최근|방금|내일|어제|올해|작년|내년|\b20\d{2}\b)/.test(s);
}

function buildSearchLinks(q) {
  const raw = normalizeQuestion(q);
  const base = encodeURIComponent(raw);
  const gov  = encodeURIComponent(`site:go.kr ${raw}`);
  const edu  = encodeURIComponent(`site:ac.kr ${raw}`);
  return [
    { label: '전체 검색', url: `https://www.google.com/search?q=${base}` },
    { label: '정부/공공(go.kr)', url: `https://www.google.com/search?q=${gov}` },
    { label: '대학/연구(ac.kr)', url: `https://www.google.com/search?q=${edu}` }
  ];
}

function generateJoseonAnswer(q) {
  const question = normalizeQuestion(q);
  const type = detectType(question);
  const topic = extractTopic(question) || '그 일';
  const lines = [];

  // ELIZA-lite: 질문 요약(되받기)
  lines.push(`하문: “${topic}”이라…`);

  switch (type) {
    case 'definition':
      lines.push('답: 뜻은 “무엇을 가리키는 말인지(범위)”가 먼저옵니다.');
      lines.push('요령: ①공식 정의(기관/문서) ②사용 맥락(예시) ③예외 순으로 확인하시오.');
      break;
    case 'howto':
      lines.push('답: 하실 일은 “목표→준비물→순서→검증” 네 토막으로 나누면 되옵니다.');
      lines.push('요령: ①목표 1줄로 고정 ②필수 단계 3~5개만 추림 ③마지막에 결과 확인(체크)하시오.');
      break;
    case 'compare':
      lines.push('답: 둘의 차이는 보통 “용도·제약·비용(또는 품질)”에서 갈리옵니다.');
      lines.push('요령: ①내 상황(예산/환경) ②꼭 필요한 기능 ③AS/공식 호환 여부 순으로 고르시오.');
      break;
    case 'recommend':
      lines.push('답: 추천은 “당장 필요”를 기준으로 고르면 실수가 적사옵니다.');
      lines.push('요령: ①최소 요구조건 ②가성비 ③공식/정품(호환·안정) 순으로 점검하시오.');
      break;
    case 'feasibility':
      lines.push('답: 대체로 가능/불가가 “조건”에 달렸사옵니다.');
      lines.push('요령: ①기기/버전/환경 ②제한(규정·호환) ③대체 수단을 함께 보시오.');
      break;
    case 'why':
      lines.push('답: 원인은 보통 “환경·설정·상태” 셋 중 하나에 있사옵니다.');
      lines.push('요령: ①방금 바뀐 것(업데이트/설정) ②재현 조건 ③에러 문구를 먼저 확인하시오.');
      break;
    case 'number':
      lines.push('답: 수치(칼로리/가격/용량 등)는 “공식 표기(라벨/공지)”가 제일 정확하옵니다.');
      lines.push('요령: ①제조사/기관 자료 ②동일 제품·동일 규격 ③최근 날짜를 확인하시오.');
      break;
    default:
      lines.push('답: 핵심은 “범위(무엇을 묻는가)”를 정하고, 그다음 “근거”를 찾는 것이옵니다.');
      lines.push(fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)]);
  }

  if (isTimeOrFactSensitive(question) || type === 'number') {
    lines.push('주의: 최신/정확 수치가 걸린 일은 단정하지 않겠사오니, 아래 “관아 기록(검색)”으로 확인하시오.');
  } else {
    lines.push('근거: 아래 “관아 기록(검색)”에서 공식 자료를 찾아 확인하시면 되옵니다.');
  }

  return { lines, links: buildSearchLinks(question) };
}

function setAnswerVisible(on) {
  answerBubble.style.visibility = on ? 'visible' : 'hidden';
  if (answerLinks) {
    const hasLinks = !!answerLinks.innerHTML && answerLinks.innerHTML.trim() !== '';
    const showLinks = !!on && hasLinks;
    answerLinks.classList.toggle('show', showLinks);
    answerLinks.setAttribute('aria-hidden', showLinks ? 'false' : 'true');
  }
}

function renderAnswer(result) {
  const lines = (result && result.lines) ? result.lines : [];
  answerBubble.innerText = question ? geegleOneLinerAnswer(question) : pick(noQuestionAnswers);

  if (answerLinks) {
    const links = (result && result.links) ? result.links : [];
    answerLinks.innerHTML = links
      .map(l => `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.label)}</a>`)
      .join('');
  }

  setAnswerVisible(true);
}

function hideAnswer() {
  answerBubble.innerText = '';
  if (answerLinks) answerLinks.innerHTML = '';
  setAnswerVisible(false);
}

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
  setBrandHeat(true);         // ✅ 추가
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
  const ans = question
    ? geegleOneLinerAnswer(question)
    : pickOne(noQuestionAnswers);

  answerBubble.innerText = ans;

  setTimeout(() => {
    sinnerGroup.classList.remove('pain');
    bubbleTimer = setTimeout(() => { answerBubble.style.visibility = 'hidden'; }, 3200);
  }, 450);
}, 520);



});

window.addEventListener('load', () => updateFireRect());

// ============================
// 지글: 한 줄 답변기 (조선 말투)
// ============================
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function normalizeQ(q) {
  return String(q || '').trim();
}

function geegleOneLinerAnswer(q) {
  const t = normalizeQ(q);

  // 날씨
  if (/(날씨|weather|비 와|눈 와|춥|덥|맑|흐리)/i.test(t)) {
    return pick([
      "오늘 날씨는 좋습니다요.",
      "오늘은 대체로 맑사옵니다요.",
      "바람이 살짝 있사오나, 무리는 없사옵니다요.",
      "비가 올 듯 말 듯 하오니 우산을 챙기시옵소서."
    ]);
  }

  // 시간/몇 시
  if (/(몇시|몇 시|시간|time|지금 몇)/i.test(t)) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `지금은 대략 ${hh}시 ${mm}분쯤 되옵니다요.`;
  }

  // 인사
  if (/^(안녕|안녕하세요|하이|hello|hi)\b/i.test(t)) {
    return pick([
      "문안 올리옵니다요.",
      "전하, 소인이 여기 있사옵니다요.",
      "어서 오시옵소서요."
    ]);
  }

  // 고마움
  if (/(고마|감사|thanks|thx)/i.test(t)) {
    return pick([
      "황공하옵니다요.",
      "별말씀을요.",
      "소인도 기쁘옵니다요."
    ]);
  }

  // 가능/불가(예/아니오)
  if (/(가능|되나|될까|해도 돼|해도 되|할 수)/i.test(t)) {
    return pick([
      "되옵니다요.",
      "대체로 가능하옵니다요.",
      "조건만 맞으면 되옵니다요."
    ]);
  }

  // 추천/선택
  if (/(추천|뭐가 더|어떤 게|할까 말까|선택|비교)/i.test(t)) {
    return pick([
      "소인은 첫째 것을 권하옵니다요.",
      "무난한 쪽으로 가시옵소서요.",
      "전하의 형편엔 둘째가 더 나아 보이옵니다요."
    ]);
  }

  // 기본 폴백
  return pick([
    "그리 하시옵소서요.",
    "옳사옵니다요.",
    "아뢰신 바, 대체로 맞사옵니다요.",
    "그 일은 무리 없사옵니다요."
  ]);
}
