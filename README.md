# 🔥 Geegle (지글) - 인류 역사상 최고의 검색 엔진

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white"/>
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black"/>
  <img src="https://img.shields.io/badge/No_Libraries-Black?style=flat-square&logo=github"/>
</p>

<p align="center"><img src = "https://github.com/user-attachments/assets/64d0a903-91b2-4dbb-a34a-2bfc9a35813d" width="50%" height="height size%">

지글(Geegle)은 구글(Google)을 패러디한 조선시대 고문 컨셉의 인터랙티브 웹사이트입니다.
마우스 커서가 '인두'로 바뀌며, 숯불에 달궈 죄인을 심문하여 답을 얻어내는 독특한 경험을 제공합니다.

[👉 **기글(Geegle) 실행해보기**](https://shimseunggi.github.io/geegle/)

</div>

---

## 📝 소개 (Introduction)

> **"무엇을 알고 싶으냐? 인두를 달구어라!"**

**지글(Geegle)**은 Google을 조선시대 풍으로 패러디한 인터랙티브 웹 토이 프로젝트입니다.  
사용자는 **죄인(검색창)**을 심문하여 원하는 답을 얻어내야 합니다. 단순한 텍스트 입력 방식을 넘어, **'달궈진 인두'**라는 독특한 커서 인터랙션을 통해 시각적, 청각적 쾌감을 제공합니다.

외부 라이브러리 없이 **순수 JavaScript(Vanilla JS)**만으로 물리 효과와 사운드 엔진을 구현했습니다.

<br/>

## ✨ 주요 기능 (Key Features)

### 1. 🔥 인터랙티브 인두 커서 (Iron Cursor System)
- **가열 시스템:** 마우스 커서(인두)를 화로(Fire Pit) 위에 올리면 실시간으로 붉게 달아오릅니다. (`Heat Controller`)
- **냉각 시스템:** 화로에서 벗어나면 서서히 식으며, 식은 인두로는 죄인을 심문할 수 없습니다.

### 2. 🔊 몰입형 사운드 & 비주얼 (Immersive FX)
- **Web Audio API:** mp3 파일 없이 브라우저 내장 신디사이저로 '치이익' 타는 소리와 비명 소리를 실시간 생성합니다. (`SoundController`)
- **파티클 효과:** 인두가 닿는 지점에서 연기가 피어오르고 화상 자국이 남습니다. (`Visual Effects`)

### 3. 🧠 조선 챗봇 (Joseon AI Mockup)
- **RegEx 기반 답변:** 사용자의 질문을 분석하여 상황에 맞는 조선시대 말투(하오체)로 답변합니다.
- **모듈화 된 두뇌:** 답변 로직을 `Brain` 모듈로 분리하여 확장성을 확보했습니다.

### 4. 📱 반응형 디자인 & 모바일 지원
- **Google-ish UI:** 구글의 머티리얼 디자인을 조선시대 풍(한지, 붓글씨)으로 재해석했습니다.
- **모바일 터치:** 모바일에서도 터치를 통해 화로를 달구고 심문할 수 있도록 이벤트를 최적화했습니다.

<br/>

## 🛠️ 기술 스택 (Tech Stack)

* **Core:** HTML5, CSS3 (Variables), Vanilla JavaScript (ES6+)
* **Audio:** Web Audio API (No external assets)
* **Animation:** `requestAnimationFrame`, CSS Keyframes
* **Hosting:** GitHub Pages

<br/>

## 📂 프로젝트 구조 (File Structure)

```
/geegle
 ├─ source/
 │  ├─ bookmark.png
 │  ├─ favicon-16x16.png
 │  ├─ favicon-32x32.png
 │  ├─ favicon-64x64.png
 │  └─ icon.png
 ├─ README.md
 ├─ index.html
 ├─ style.css
 └─ app.js   
```

shimseunggi with Gemini, chatGPT, Codex
