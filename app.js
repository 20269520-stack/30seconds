// PWA 및 스플래시 제어
let deferredPrompt;

window.addEventListener('DOMContentLoaded', () => {
  // 스플래시 화면 1.8초 후 종료
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    splash.classList.add('hidden');
  }, 1800);

  // Service Worker 등록
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  }
});

// PWA 설치 버튼 감지
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('install-btn');
  installBtn.classList.remove('hidden');

  installBtn.addEventListener('click', () => {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      installBtn.classList.add('hidden');
      deferredPrompt = null;
    });
  });
});

// 모드 선택 탭 전환 로직
const tabBtns = document.querySelectorAll('.tab-btn');
const inputSections = {
  youtube: document.getElementById('input-youtube'),
  file: document.getElementById('input-file'),
  text: document.getElementById('input-text')
};
let currentMode = 'youtube';

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    currentMode = btn.dataset.mode;
    Object.keys(inputSections).forEach(mode => {
      if (mode === currentMode) {
        inputSections[mode].classList.remove('hidden');
      } else {
        inputSections[mode].classList.add('hidden');
      }
    });
  });
});

// 파일 선택 시 이름 표시
const fileInput = document.getElementById('file-input');
const fileNameDisplay = document.getElementById('file-name-display');

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    fileNameDisplay.innerText = `선택됨: ${file.name}`;
  }
});

// Helper: 파일을 Base64로 변환
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

// 요약하기 실행 로직
const analyzeBtn = document.getElementById('analyze-btn');
const resultBox = document.getElementById('result-box');
const loadingText = document.getElementById('loading');

analyzeBtn.addEventListener('click', async () => {
  let payload = null;

  // 모드별 데이터 수집
  if (currentMode === 'youtube') {
    const url = document.getElementById('yt-input').value.trim();
    if (!url) return alert('유튜브 링크를 입력해 주세요!');
    payload = url;
  } 
  else if (currentMode === 'file') {
    const file = fileInput.files[0];
    if (!file) return alert('PDF 또는 이미지 파일을 선택해 주세요!');
    const base64 = await fileToBase64(file);
    payload = { base64, mimeType: file.type };
  } 
  else if (currentMode === 'text') {
    const text = document.getElementById('text-input').value.trim();
    if (!text) return alert('요약할 텍스트를 입력해 주세요!');
    payload = text;
  }

  // UI 상태 변환
  resultBox.classList.add('hidden');
  loadingText.classList.remove('hidden');
  analyzeBtn.disabled = true;

  try {
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: currentMode, payload })
    });

    const data = await response.json();

    if (response.ok) {
      resultBox.innerText = data.result;
      resultBox.classList.remove('hidden');
    } else {
      resultBox.innerText = "오류: " + (data.error || "요약을 생성하지 못했습니다.");
      resultBox.classList.remove('hidden');
    }
  } catch (error) {
    console.error(error);
    resultBox.innerText = "서버 통신 실패: 인터넷 연결이나 Vercel 배포를 확인해 주세요.";
    resultBox.classList.remove('hidden');
  } finally {
    loadingText.classList.add('hidden');
    analyzeBtn.disabled = false;
  }
});