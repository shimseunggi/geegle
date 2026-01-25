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
const sinnerGroup = $('#sinner-group');

const HEAT_DURATION_MS = 5000;

let isHeated = false;
let heatTimer = null;
let heatCountdownTimer = null;
let heatEndsAt = 0;
let bubbleTimer = null;
let burnTimer = null;
let answerTimer = null;
let painFailSafe = null;

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

// ============================
// A버전: “답만 하는” 규칙 기반 답변 엔진(오프라인)
// - API/모델 없이, 질문 패턴 → 짧은 조선시대 말투 답변
// - 경우의 수(룰)를 많이 넣어두면 자연스럽게 "똑똑한 척" 가능
// ============================

function pickOne(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
function normalizeQ(s){
  return (s || '')
    .toString()
    .trim()
    .replace(/[“”"']/g, '')
    .replace(/\s+/g, ' ');
}
function lowerQ(s){ return normalizeQ(s).toLowerCase(); }

// ✅ 질문이 없을 때(그대로 유지)
const noQuestionAnswers = [
  "묻는 말이 없사온데, 어찌 답하오리까.",
  "질문을 적으시옵고 지지시옵소서.",
  "무엇을 물으시는지 먼저 적어주시옵소서.",
  "글을 남기시옵소서. 소인이 곧 답하리다.",
  "질문이 없으니, 대답도 없사옵니다요."
];

// ✅ 인두가 차가울 때(그대로 유지)
const coldMockery = [
  "하나도 안 뜨겁사옵니다요.",
  "화로에 다시 달구어 오시옵소서.",
  "식은 인두로는 어림없사옵니다요.",
  "시원하옵니다요. 더 달구시옵소서.",
  "장난은 그만하시옵고, 불을 더 지피시옵소서."
];

// ✅ 규칙(패턴) → 답변 후보들
// - re: 정규식(대소문자 무시 i)
// - replies: 짧은 답변 여러 개(랜덤 선택)
const A_RULES = [
  // 0) 인사/대화
  { re: /\b(안녕|하이|hello|hi|반가워|반갑)\b/i, replies: [
    "반갑사옵니다요.",
    "안녕하시옵니까요.",
    "평안하시옵니까요.",
    "무탈하시옵니까요."
  ]},
  { re: /\b(고마워|감사|thanks|thx)\b/i, replies: [
    "별말씀을요.",
    "소인이 영광이옵니다요.",
    "고맙게 여겨 주시니 다행이옵니다요.",
    "천만에요."
  ]},
  { re: /\b(미안|죄송|sorry)\b/i, replies: [
    "괜찮사옵니다요.",
    "허물은 잊으시옵소서.",
    "마음 쓰지 마시옵소서.",
    "부디 상심치 마시옵소서."
  ]},
  { re: /\b(잘자|굿나잇|good night|취침|자러)\b/i, replies: [
    "편히 쉬시옵소서.",
    "단잠 드시옵소서.",
    "꿈자리가 좋으시길 비옵니다요.",
    "내일을 위해 몸을 아끼시옵소서."
  ]},
  { re: /\b(좋아|사랑|최고|짱)\b/i, replies: [
    "그 마음, 기쁘옵니다요.",
    "고맙사옵니다요.",
    "좋사옵니다요."
  ]},

  // 1) 정체/설명
  { re: /(너 누구|누구냐|정체|너 뭐야|지글|geegle)/i, replies: [
    "소인은 지글이라 하옵니다요.",
    "지글이라 부르시옵소서.",
    "소인은 물음에 답하는 자이옵니다요.",
    "인두로 물어 답을 얻는 장난이옵니다요."
  ]},
  { re: /(사용법|어떻게 써|어케 써|how to use|help|도움)/i, replies: [
    "질문을 적고, 인두를 달군 뒤 죄인을 지지시옵소서.",
    "먼저 물음을 적으시고, 화로에 인두를 달구시옵소서.",
    "적고 → 달구고 → 지지면, 답이 나오옵니다요.",
    "검색을 누르고, 인두를 달구어 지지시옵소서."
  ]},

  // 2) 시간/날짜(로컬 기준)
  { re: /(몇 ?시|시간 알려|time now|지금 시간)/i, replies: ["__TIME__"] },
  { re: /(오늘 날짜|며칠|몇월|몇 일|date today|오늘 몇일)/i, replies: ["__DATE__"] },
  { re: /(요일|무슨 요일|day of week)/i, replies: ["__DOW__"] },

  // 3) 날씨(실측 불가 → 컨셉 답변)
  { re: /(날씨|기온|온도|비 와|비오|눈 와|눈오|미세먼지|황사)/i, replies: [
    "오늘 날씨는 좋습니다요.",
    "오늘 날씨는 무난하옵니다요.",
    "오늘은 바람이 잦사옵니다요.",
    "오늘은 하늘이 밝사옵니다요.",
    "오늘은 바깥이 거칠 수 있사오니 조심하시옵소서."
  ]},
  { re: /(춥|추워|한파)/i, replies: [
    "바람이 매섭사오니 겹겹이 입으시옵소서.",
    "몸을 덥히시옵소서.",
    "따뜻한 차 한 잔이 좋겠사옵니다요.",
    "손발을 먼저 녹이시옵소서."
  ]},
  { re: /(덥|더워|폭염)/i, replies: [
    "바람 잘 통하는 옷이 좋사옵니다요.",
    "물 자주 드시옵소서.",
    "그늘을 찾으시옵소서.",
    "몸을 식히시옵소서."
  ]},
  { re: /(우산|비 맞|장마)/i, replies: [
    "우산을 챙기시옵소서.",
    "빗길은 미끄럽사오니 조심하시옵소서.",
    "비를 맞으면 감기 들기 쉽사옵니다요."
  ]},

  // 4) 옷/코디/꾸밈
  { re: /(뭐 입|옷 추천|코디|스타일|룩|패션)/i, replies: [
    "단정한 옷이 제일 무난하옵니다요.",
    "겉옷 하나는 챙기시옵소서.",
    "색은 두 가지만 맞추면 깔끔하옵니다요."
  ]},

  // 5) 음식/메뉴
  { re: /(뭐 먹|뭐먹|점심|저녁|아침|야식|메뉴 추천|먹을거|배고)/i, replies: [
    "따끈한 국밥이 좋사옵니다요.",
    "면 한 그릇이 속을 달래주옵니다요.",
    "든든하게 밥과 반찬을 챙기시옵소서.",
    "가벼이 드시려면 죽이 무난하옵니다요.",
    "간단히 김밥 한 줄도 좋사옵니다요."
  ]},
  { re: /(매운|매콤)/i, replies: [
    "매운맛은 잠시 마음을 깨우옵니다요.",
    "매콤하게 드시되 속은 살피시옵소서.",
    "매운 것은 적당히가 좋사옵니다요."
  ]},
  { re: /(커피|카페인|아메리카노|라떼)/i, replies: [
    "커피 한 잔은 정신을 맑게 하옵니다요.",
    "카페인은 과하면 잠을 해치옵니다요.",
    "한 잔만으로도 충분하옵니다요."
  ]},
  { re: /(술|음주|소주|맥주)/i, replies: [
    "술은 과하면 몸을 해치옵니다요.",
    "오늘은 한 잔으로 그치시옵소서.",
    "물도 함께 드시옵소서."
  ]},

  // 6) 컨디션/건강(안전형 한 줄)
  { re: /(아파|통증|열나|두통|기침|가래|설사|구토|감기|독감|코막힘|비염)/i, replies: [
    "휴식과 수분이 먼저이옵니다요.",
    "병세가 크면 의관을 찾으시옵소서.",
    "증세가 이어지면 진찰을 받으시옵소서."
  ]},
  { re: /(약|약 먹|처방|복용|부작용)/i, replies: [
    "약은 처방과 설명을 따르시옵소서.",
    "복용은 의관의 뜻을 좇는 것이 옳사옵니다요.",
    "불편이 크면 약사나 의관께 묻는 것이 안전하옵니다요."
  ]},
  { re: /(다이어트|살 빼|체중|몸무게)/i, replies: [
    "적게 먹고 자주 움직이시옵소서.",
    "급히 빼면 급히 돌아오옵니다요.",
    "꾸준함이 이기옵니다요."
  ]},

  // 7) 감정/멘탈
  { re: /(우울|불안|힘들|지쳤|스트레스|멘탈|공허)/i, replies: [
    "오늘은 쉬어 가시옵소서.",
    "숨을 고르고 한 걸음씩 가시옵소서.",
    "지친 날엔 잠시 멈춤도 용기이옵니다요.",
    "말로 풀면 마음이 가벼워지옵니다요."
  ]},
  { re: /(짜증|화나|열받|빡쳐)/i, replies: [
    "잠시 물 한 모금 하고 가시옵소서.",
    "한 걸음 물러나면 길이 보이옵니다요.",
    "성낸다고 일이 풀리진 않사옵니다요."
  ]},

  // 8) 공부/일/동기
  { re: /(공부|과제|시험|레포트|보고서|면접|발표|프레젠|ppt)/i, replies: [
    "먼저 목차를 세우시옵소서.",
    "작게 쪼개면 끝이 보이옵니다요.",
    "오늘 할 몫을 정하고 바로 시작하시옵소서.",
    "마감부터 역산하시옵소서."
  ]},
  { re: /(집중|집중 안돼|딴생각|미루|게으름)/i, replies: [
    "열다섯 숨만큼만 시작하시옵소서.",
    "핸드폰을 잠시 멀리 두시옵소서.",
    "한 번에 한 가지를 하시옵소서.",
    "타이머를 켜고 10분만 해보시옵소서."
  ]},
  { re: /(동기|의욕|의지|귀찮)/i, replies: [
    "하기 싫을 때가 진짜 실력이옵니다요.",
    "작게 시작하면 의욕은 뒤따르옵니다요.",
    "오늘은 최소한만 하시옵소서."
  ]},

  // 9) 운동/루틴
  { re: /(운동|헬스|러닝|수영|스트레칭|근력|유산소|요가)/i, replies: [
    "가볍게 몸을 풀고 천천히 올리시옵소서.",
    "무리하면 탈이 나옵니다요.",
    "꾸준함이 제일이옵니다요.",
    "오늘은 폼을 지키는 게 우선이옵니다요."
  ]},

  // 10) 일정/계획/시간관리
  { re: /(일정|계획|스케줄|루틴|시간표)/i, replies: [
    "오늘 할 일 셋만 적으시옵소서.",
    "큰 일은 쪼개야 움직이옵니다요.",
    "가장 급한 것부터 처리하시옵소서."
  ]},

  // 11) 돈/소비/투자(안전형)
  { re: /(돈|예산|저축|절약|소비|지출)/i, replies: [
    "쓰임을 먼저 정하면 새는 돈이 줄어드옵니다요.",
    "필요와 욕심을 가르시옵소서.",
    "오늘은 지갑을 단단히 여미시옵소서.",
    "한 번 장바구니에 담고 하루를 두시옵소서."
  ]},
  { re: /(투자|주식|코인|비트|etf|리스크|수익률)/i, replies: [
    "수익엔 늘 위험이 따르옵니다요.",
    "잃어도 되는 돈으로만 하시옵소서.",
    "남 말만 믿고 들어가면 후회가 남사옵니다요."
  ]},

  // 12) 여행/어디갈까
  { re: /(여행|어디 가|어디갈|나들이|데이트|갈만한)/i, replies: [
    "가까운 곳부터 다녀오시옵소서.",
    "사람 적은 시간대를 노리시옵소서.",
    "걷기 좋은 곳이 무난하옵니다요."
  ]},

  // 13) 기술/코딩/오류
  { re: /(버그|오류|에러|error|콘솔|console|js|javascript|css|html|프론트|백엔드)/i, replies: [
    "콘솔의 붉은 글을 먼저 살피시옵소서.",
    "최근에 바꾼 부분부터 되짚으시옵소서.",
    "하나씩 끊어가며 원인을 찾으시옵소서.",
    "캐시를 비우고 다시 보시옵소서."
  ]},
  { re: /(깃허브|github|pages|배포|deploy|도메인|호스팅)/i, replies: [
    "정적 파일이면 깃허브 페이지로도 족하옵니다요.",
    "경로와 대소문자를 엄격히 맞추시옵소서.",
    "캐시가 남으면 강력 새로고침을 하시옵소서."
  ]},

  // 14) 요약/정리/번역/해석
  { re: /(요약|정리|핵심|한줄)/i, replies: [
    "원문을 붙여주시면 핵심만 뽑아드리겠사옵니다요.",
    "자료를 주시면 깔끔히 정리하겠사옵니다요.",
    "내용을 보여주셔야 요약이 가능하옵니다요."
  ]},
  { re: /(번역|해석|translate)/i, replies: [
    "원문을 주시면 옮기겠사옵니다요.",
    "문장을 보내주시면 번역해드리겠사옵니다요.",
    "원문이 없으니 번역이 어려우옵니다요."
  ]},
  { re: /(맞춤법|띄어쓰기|오탈자)/i, replies: [
    "문장을 붙여주시면 바로잡아드리겠사옵니다요.",
    "글을 주시면 매만져드리겠사옵니다요."
  ]},

  // 15) 선택/추천/비교
  { re: /(추천|골라|선택|뭐가 좋|어떤게 좋|사야)/i, replies: [
    "무난한 쪽이 길게 가옵니다요.",
    "지금은 간단한 선택이 옳사옵니다요.",
    "가장 자주 쓰는 것을 고르시옵소서.",
    "후회가 적은 쪽을 택하시옵소서."
  ]},
  { re: /(비교|차이|vs|대비)/i, replies: [
    "장점과 단점을 나눠 보시옵소서.",
    "가격·내구·편의 셋만 보면 답이 나오옵니다요.",
    "목적이 분명하면 선택도 쉬워지옵니다요."
  ]},

  // 16) 관계/연애/사람
  { re: /(연애|썸|짝사랑|헤어|이별|고백)/i, replies: [
    "말로 정리하면 길이 트이옵니다요.",
    "상대의 뜻도 살피시옵소서.",
    "마음을 숨기면 후회가 남사옵니다요."
  ]},
  { re: /(친구|사람|관계|소통|대화|오해)/i, replies: [
    "말을 짧고 분명히 하시옵소서.",
    "상대의 말을 끝까지 들으시옵소서.",
    "감정은 낮추고 사실을 올리시옵소서."
  ]},

  // 17) 디자인/감각
  { re: /(디자인|레이아웃|타이포|폰트|그리드|색|컬러|브랜딩|로고)/i, replies: [
    "여백이 곧 품격이옵니다요.",
    "폰트는 두 가지만 쓰시옵소서.",
    "대비를 세우면 읽힘이 좋아지옵니다요.",
    "정렬만 맞춰도 반은 먹고 들어가옵니다요."
  ]},

  // 18) 가격/얼마/비용
  { re: /(얼마|가격|비용|값|견적)/i, replies: [
    "값은 곳마다 다르옵니다요.",
    "정확한 값은 조건을 더 알려주셔야 하옵니다요.",
    "대략은 가능하오나, 세부가 필요하옵니다요."
  ]},

  // 19) 왜/원인/이유
  { re: /(왜|원인|이유|까닭)/i, replies: [
    "대개는 조건이 하나 어긋난 탓이옵니다요.",
    "원인은 하나가 아닐 때가 많사옵니다요.",
    "최근에 바뀐 것이 원인일 가능성이 크옵니다요."
  ]},

  // 20) 방법/어떻게/해야
  { re: /(어떻게|방법|해결|해야|하나)/i, replies: [
    "큰 걸 먼저, 작은 건 나중에 하시옵소서.",
    "한 번에 하나씩 처리하시옵소서.",
    "가장 쉬운 것부터 손대면 길이 트이옵니다요."
  ]},

  // 21) 가능/불가능/해도돼
  { re: /(가능해|가능함|해도 돼|해도되|되나|될까)/i, replies: [
    "가능하옵니다요.",
    "대개는 되옵니다요.",
    "조건만 맞추면 되옵니다요."
  ]},
  { re: /(불가능|안 돼|안되|못해|힘들어)/i, replies: [
    "그 일은 어렵사옵니다요.",
    "지금은 무리이옵니다요.",
    "다른 길을 택하시옵소서."
  ]},

  // 22) 운세/점/미신
  { re: /(운세|사주|점괘|타로)/i, replies: [
    "운은 참고만 하시옵소서.",
    "오늘은 마음가짐이 길흉을 가르옵니다요.",
    "좋은 징조만 취하시옵소서."
  ]},

  // 23) 게임/잡담
  { re: /(게임|스듀|스타듀|stardew|롤|발로|minecraft|포켓몬)/i, replies: [
    "즐길 땐 즐기되, 끝낼 때는 끝내시옵소서.",
    "오늘은 운이 따르옵니다요.",
    "너무 무리하진 마시옵소서."
  ]},

  // 24) 정치/사회(중립 한 줄)
  { re: /(정치|대통령|선거|국회|정당)/i, replies: [
    "그 일은 각자 판단이 필요하옵니다요.",
    "여럿의 말을 듣고 스스로 가르시옵소서.",
    "감정이 아닌 근거를 살피시옵소서."
  ]},

  // 25) 욕설/무례(톤 정리)
  { re: /(ㅅㅂ|시발|씨발|병신|좆|꺼져|닥쳐)/i, replies: [
    "말을 고르시옵소서.",
    "거친 말은 복을 쫓아내옵니다요.",
    "잠시 숨을 고르시옵소서."
  ]},

  // 26) 예/아니오(짧게)
  { re: /^(응|ㅇㅇ|그래|그렇지|맞아|예|yes)\b/i, replies: [
    "그러하옵니다요.",
    "옳사옵니다요.",
    "그리 하시옵소서."
  ]},
  { re: /^(아니|ㄴㄴ|no|아닙|싫)\b/i, replies: [
    "아니옵니다요.",
    "그리 아니하옵니다요.",
    "그 길은 피하시옵소서."
  ]},
];

// ✅ 마지막 폴백(아무 룰에도 안 걸릴 때)
const A_FALLBACK = [
  "그러하옵니다요.",
  "그리 하시면 되옵니다요.",
  "소인이 보기엔 무난하옵니다요.",
  "지금은 그리 하시되, 상황을 보며 바꾸시옵소서.",
  "알 길이 없사오니, 더 자세히 적어주시옵소서."
];

function formatTwo(n){ return String(n).padStart(2, '0'); }
function getTimeLine(){
  const d = new Date();
  return `지금은 ${d.getHours()}시 ${formatTwo(d.getMinutes())}분이옵니다요.`;
}
function getDateLine(){
  const d = new Date();
  return `오늘은 ${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일이옵니다요.`;
}
function getDowLine(){
  const d = new Date();
  const days = ["일","월","화","수","목","금","토"];
  return `오늘은 ${days[d.getDay()]}요일이옵니다요.`;
}

// ✅ 아주 간단한 산수 처리(원하면 더 확장 가능)
function trySimpleMath(raw){
  const s = raw.replace(/,/g,'').trim();
  const m = s.match(/^(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const a = Number(m[1]), op = m[2], b = Number(m[3]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

  let r;
  if (op === '+') r = a + b;
  else if (op === '-') r = a - b;
  else if (op === '*') r = a * b;
  else if (op === '/') {
    if (b === 0) return "0으로 나눌 수는 없사옵니다요.";
    r = a / b;
  }
  const pretty = Number.isInteger(r) ? String(r) : String(Math.round(r * 1000) / 1000);
  return `그 값은 ${pretty}이옵니다요.`;
}

function geegleAnswer(rawQuestion){
  const raw = normalizeQ(rawQuestion);
  if (!raw) return pickOne(noQuestionAnswers);

  // 산수 먼저
  const mathLine = trySimpleMath(raw);
  if (mathLine) return mathLine;

  const low = lowerQ(raw);

  for (const rule of A_RULES){
    if (rule.re.test(raw) || rule.re.test(low)){
      const picked = pickOne(rule.replies);

      if (picked === "__TIME__") return getTimeLine();
      if (picked === "__DATE__") return getDateLine();
      if (picked === "__DOW__")  return getDowLine();

      return picked;
    }
  }

  return pickOne(A_FALLBACK);
}

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

  // ✅ 이전 인터랙션 타이머 정리(연타/예외로 pain 고착 방지)
  if (bubbleTimer) { clearTimeout(bubbleTimer); bubbleTimer = null; }
  if (burnTimer)   { clearTimeout(burnTimer); burnTimer = null; }
  if (answerTimer) { clearTimeout(answerTimer); answerTimer = null; }
  if (painFailSafe){ clearTimeout(painFailSafe); painFailSafe = null; }
  sinnerGroup.classList.remove('pain');

  if (!isHeated) {
    const mock = coldMockery[Math.floor(Math.random() * coldMockery.length)];
    answerBubble.innerText = mock;
    answerBubble.style.visibility = 'visible';
    bubbleTimer = setTimeout(() => { answerBubble.style.visibility = 'hidden'; }, 2200);
    return;
  }

  // ✅ pain 애니메이션을 매번 확실히 재생 + 최악의 경우 2초 후 강제 해제
  void sinnerGroup.offsetWidth;
  sinnerGroup.classList.add('pain');
  painFailSafe = setTimeout(() => { sinnerGroup.classList.remove('pain'); painFailSafe = null; }, 2000);

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

  burnTimer = setTimeout(() => { createBurnMark(p.clientX, p.clientY); burnTimer = null; }, 280);

  answerTimer = setTimeout(() => {
    const pick = question ? geegleAnswer(question) : pickOne(noQuestionAnswers);

    answerBubble.innerText = pick;

    setTimeout(() => {
      sinnerGroup.classList.remove('pain');
      if (painFailSafe){ clearTimeout(painFailSafe); painFailSafe = null; }
      bubbleTimer = setTimeout(() => { answerBubble.style.visibility = 'hidden'; }, 3200);
    }, 450);
    answerTimer = null;
  }, 520);
});

window.addEventListener('load', () => updateFireRect());
