import { YoutubeTranscript } from 'youtube-transcript';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const SYSTEM_PROMPT = "다음 내용을 30초 안에 쉽게 읽을 수 있도록 핵심 위주로 3~5줄의 불릿 포인트(-)로 깔끔하게 요약해 줘.";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 허용됩니다.' });
  }

  try {
    const { mode, payload } = req.body;
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 1. 유튜브 자막 요약
    if (mode === 'youtube') {
      const transcriptArray = await YoutubeTranscript.fetchTranscript(payload);
      const transcriptText = transcriptArray.map(item => item.text).join(' ');
      
      const result = await model.generateContent(`${SYSTEM_PROMPT}\n\n[영상 자막]:\n${transcriptText}`);
      return res.status(200).json({ result: result.response.text() });
    }

    // 2. 파일(PDF, PNG, JPG) 요약
    if (mode === 'file') {
      const result = await model.generateContent([
        SYSTEM_PROMPT,
        {
          inlineData: {
            mimeType: payload.mimeType,
            data: payload.base64
          }
        }
      ]);
      return res.status(200).json({ result: result.response.text() });
    }

    // 3. 텍스트 직접 입력 요약
    if (mode === 'text') {
      const result = await model.generateContent(`${SYSTEM_PROMPT}\n\n[입력 글]:\n${payload}`);
      return res.status(200).json({ result: result.response.text() });
    }

    return res.status(400).json({ error: '유효하지 않은 요청 모드입니다.' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: '처리 중 오류가 발생했습니다. (유튜브 자막 미지원 영상 또는 불가능한 파일 형식일 수 있습니다)' 
    });
  }
}
