import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health Check Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Chatbot API Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, currentLang = 'ko', faqs = [] } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || '';

    const ai = getGeminiClient();

    // Prepare system instruction with school context
    const faqContext = Array.isArray(faqs) && faqs.length > 0
      ? faqs.map((f: any) => `[FAQ - ${f.category}] 질문: ${f.title}\n답변 요약: ${f.content?.replace(/<[^>]*>?/gm, ' ').slice(0, 200)}`).join('\n\n')
      : '';

    const systemInstruction = `
당신은 대한민국 대구에 위치한 '계명대학교(Keimyung University) 한국어학당(Korean Language Institute) 외국인 유학생 전용 AI 가이드 챗봇'입니다.
외국인 유학생(D-4 비자 어학연수생 및 학위과정 유학생)들의 안정적인 학업과 한국 체류를 돕기 위해 친절하고 정확하게 안내합니다.

[핵심 안내 정보]
1. 출결 및 수료 기준:
   - 최소 출석률: 직전 학기 출석률 80% 이상 필수 (수료 및 비자 연장 필수 조건)
   - 출석률 70% 미만 시 출입국외국인청에 통보되며 비자 연장이 제한될 수 있음.
   - 질병 결석 시 병원 진단서/진료확인서를 3일 이내에 행정실에 제출해야 공결 처리 가능.

2. D-4 체류기간(비자) 연장:
   - 신청 시기: 체류기간 만료일 4개월 전부터 관할 출입국 사전 방문예약 또는 하이코리아 전자민원 신청.
   - 필수 서류: 통합신청서, 여권 원본 및 사본, 외국인등록증, 한국어학당 재학증명서, 출석·성적증명서, 체류지 입증서류(임대차계약서 또는 기숙사 거주확인서), 은행 잔고증명서(1,000만원 이상 등).

3. 아르바이트 (시간제 취업):
   - 원칙적으로 D-4 비자는 원칙적 취업 금지이나, 입국 후 6개월 경과 + 출석률 90% 이상 + TOPIK(한국어능력시험) 2급 이상 보유 시 법무부 체류자격외활동허가를 받아 주당 10~20시간 합법 근무 가능. 허가 없는 불법 취업 시 강제 출국 등 중대 처벌.

4. 명교생활관 (기숙사):
   - 입사 시 필수: 3개월 이내 결핵 검진 결과서(흉부 X-ray).
   - 외박 신청: 기숙사 포털 시스템을 통해 전날 23:00까지 사전 승인 신청. 무단 외박 시 벌점 부과.

5. 국민건강보험:
   - 외국인 등록 완료 시 건강보험공단에 자동 당연가입. 매월 정해진 기한 내에 보험료 납부 필수(체납 시 비자 연장 거부).

6. 행정실 안내:
   - 부서: 계명대학교 국제처 외국인학생지원팀 (한국어학당 행정실)
   - 위치: 계명대학교 성서캠퍼스 동영관 101호
   - 운영 시간: 평일 09:00 ~ 17:00 (점심시간 12:00 ~ 13:00 / 주말 및 공휴일 휴무)
   - 전화번호: 053-580-6923, 6924

[포털에 등록된 실시간 FAQ 안내 데이터]:
${faqContext}

[답변 언어 최우선 원칙 - 학생 모국어 자동 감지 및 일치 응답]:
★ 가장 중요한 원칙: 유학생이 질문을 작성한 언어(모국어)를 자동으로 감지하여, 질문자가 질문한 바로 그 동일한 언어로 반드시 답변해야 합니다!
1. 학생이 베트남어(Tiếng Việt)로 질문한 경우: 포털 기본 언어 설정과 상관없이 반드시 유창하고 자연스러운 베트남어로 상세히 답변하세요.
2. 학생이 몽골어(Монгол хэл)로 질문한 경우: 반드시 몽골어로 상세히 답변하세요.
3. 학생이 중국어(简体中文)로 질문한 경우: 반드시 중국어로 상세히 답변하세요.
4. 학생이 영어(English)로 질문한 경우: 반드시 영어로 상세히 답변하세요.
5. 학생이 러시아어, 우즈베크어, 일본어 등 기타 언어로 질문한 경우: 질문한 해당 언어로 응답하세요.
6. 학생이 한국어로 질문한 경우: 친절하고 정확한 한국어로 답변하세요.
7. 질문의 언어가 너무 짧거나 모호한 경우에만 사용자의 포털 지정 언어 [${currentLang}]로 응답하세요.

[답변 서식 원칙]:
1. 외국인 유학생이 한눈에 이해하기 쉽도록 불릿 기호(•), 번호 목록(1., 2.), 굵은 글씨(**)를 적극 활용하세요.
2. 건물명(동영관 101호), 관할 출입국, 하이코리아 등 고유명사는 괄호 안에 한국어 병기를 권장합니다.
3. 부정확하거나 모르는 내용은 추측하지 말고, 동영관 101호 국제처 행정실(053-580-6923)에 직접 방문하거나 문의하도록 정중히 안내하세요.
4. 친절하고 배려심 넘치는 대학 행정 도우미 어조를 유지하세요.
    `.trim();

    let reply = '';

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: messages.map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        reply = response.text || '';
      } catch (geminiErr: any) {
        console.warn('gemini-3.8-flash primary call failed, trying backup model:', geminiErr?.message || geminiErr);
        try {
          const fallbackRes = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: messages.map((m: any) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            })),
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          reply = fallbackRes.text || '';
        } catch (backupErr) {
          console.warn('Backup Gemini call also failed, using knowledge base synthesis:', backupErr);
        }
      }
    }

    if (!reply) {
      // Offline fallback rule-based response
      const lower = lastUserMessage.toLowerCase();
      if (lower.includes('비자') || lower.includes('d-4') || lower.includes('연장') || lower.includes('visa')) {
        reply = `**[D-4 비자 체류기간 연장 안내]**\n\n• **신청 기간**: 체류기간 만료일 4개월 전부터 관할 출입국 사전 예약 또는 하이코리아 전자민원 신청\n• **필수 제출 서류**:\n1. 통합신청서, 여권 원본 및 사본, 외국인등록증\n2. 한국어학당 재학증명서 및 출석·성적증명서 (동영관 101호 발급)\n3. 체류지 입증서류 (기숙사 거주확인서 또는 임대차계약서)\n4. 등록금 납입증명서 및 은행 잔고증명서 (1,000만원 이상 등 기준 금액)\n\n※ 직전 학기 출석률이 80% 미만인 경우 비자 연장에 제한이 있을 수 있으니 사전에 행정실 상담을 권장합니다.`;
      } else if (lower.includes('출석') || lower.includes('수료') || lower.includes('attendance')) {
        reply = `**[출석률 및 정규과정 수료 기준 안내]**\n\n• **최소 출석률**: 학기 총 수업일수의 **80% 이상** 출석 시 정상 수료 및 비자 연장이 가능합니다.\n• **유의 사항**: 출석률이 70% 미만으로 떨어질 경우 법무부 출입국 외국인정책본부에 통보되며, 차기 비자 연장이 불허될 수 있습니다.\n• **공결(병결) 처리**: 질병으로 결석 시 3일 이내에 병원 진료확인서/진단서를 행정실(동영관 101호)에 제출하셔야 합니다.`;
      } else if (lower.includes('위치') || lower.includes('시간') || lower.includes('행정실') || lower.includes('전화') || lower.includes('contact') || lower.includes('office')) {
        reply = `**[국제처 한국어학당 행정실 안내]**\n\n• **위치**: 계명대학교 성서캠퍼스 동영관 101호\n• **운영 시간**: 평일 09:00 ~ 17:00 (점심시간: 12:00 ~ 13:00 / 토, 일, 공휴일 휴무)\n• **연락처**: 053-580-6923, 6924\n• **지원 업무**: 재학/출석증명서 발급, 비자 연장 상담, 기숙사 및 보험 안내`;
      } else if (lower.includes('알바') || lower.includes('취업') || lower.includes('일') || lower.includes('job') || lower.includes('work')) {
        reply = `**[외국인 유학생 시간제 취업(아르바이트) 규정]**\n\n• D-4 어학연수생은 원칙적으로 입국 후 **6개월이 경과**해야 시간제 취업 허가 신청이 가능합니다.\n• **기본 자격**: 직전 학기 출석률 90% 이상 + TOPIK 2급 이상 취득자 권장\n• **절차**: 학교 외국인학생지원팀 확인서 작성 ➔ 관할 출입국 '체류자격 외 활동허가' 사전 승인 필수 (허가 없는 취업은 불법체류 단속 대상)`;
      } else if (lower.includes('기숙사') || lower.includes('외박') || lower.includes('명교') || lower.includes('dorm')) {
        reply = `**[명교생활관(기숙사) 입사 및 외박 신청 안내]**\n\n• **입사 필수 서류**: 3개월 이내 발급된 결핵검진 결과서(흉부 X-ray)\n• **외박 신청**: 기숙사 포털 시스템을 통해 전날 23:00까지 사전 온라인 신청 승인 필수\n• 문의: 명교생활관 행정실 (053-580-6882)`;
      } else {
        reply = `안녕하세요! 계명대학교 한국어학당 AI 가이드 챗봇입니다. 😊\n\n비자 연장, 출석률 기준, 서식 발급, 기숙사 입사 등 유학생 생활에 대해 궁금하신 점을 물어보시면 자세히 답변해 드립니다.\n\n• 추천 질문:\n- "D-4 비자 연장에 필요한 서류는?"\n- "수료를 위한 최소 출석률은 몇 %인가요?"\n- "행정실 위치와 운영 시간은 언제인가요?"`;
      }
    }

    return res.json({ text: reply });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: '챗봇 응답 중 오류가 발생했습니다.',
      details: error.message || String(error),
    });
  }
});

// Setup Vite or Static File Serving
async function initServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`KMU International Student Portal Server running on http://0.0.0.0:${port}`);
  });
}

initServer().catch((err) => {
  console.error('Failed to start server:', err);
});
