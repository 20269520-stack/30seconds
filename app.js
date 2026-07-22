let currentMode = 'youtube';

// 1. 탭 전환 이벤트 처리
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    e.target.classList.add('active');
    currentMode = e.target.dataset.tab;
    document.getElementById(`tab-${currentMode}`).classList.add('active');
  });
});

// 2. 요약 버튼 클릭 처리
document.getElementById('summarize-btn').addEventListener('click', async () => {
  const resultBox = document.getElementById('result-box');
  const loading = document.getElementById('loading');
  
  resultBox.classList.add('hidden');
  resultBox.innerText = '';
  
  let payload = null;

  // 모드별 데이터 준비
  if (currentMode === 'youtube') {
    payload = document.getElementById('youtube-url').value.trim();
    if (!payload) return alert('유튜브 링크를 입력해 주세요!');
  } else if (currentMode === 'text') {
    payload = document.getElementById('text-input').value.trim();
    if (!payload) return alert('요약할 텍스트를 입력해 주세요!');
  } else if (currentMode === 'file') {
    const fileInput = document.getElementById('file-input');
    if (!fileInput.files || fileInput.files.length === 0) {
      return alert('요약할 파일(PDF/이미지)을 선택해 주세요!');
    }
    const file = fileInput.files[0];
    payload = await convertFileToBase64(file);
  }

  loading.classList.remove('hidden');

  try {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: currentMode, payload })
    });

    const data = await res.json();
    loading.classList.add('hidden');

    if (res.ok) {
      resultBox.innerText = data.result;
      resultBox.classList.remove('hidden');
    } else {
      alert('오류 발생: ' + (data.error || '요약에 실패했습니다.'));
    }
  } catch (err) {
    loading.classList.add('hidden');
    alert('서버 통신 실패: ' + err.message);
  }
});

// 파일을 Base64 바이너리 인코딩 데이터로 변환해주는 함수
function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve({
        mimeType: file.type,
        base64: base64String
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
