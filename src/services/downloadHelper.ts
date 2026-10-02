import { DocumentItem } from '../types';

export const triggerDocumentDownload = (doc: DocumentItem): void => {
  const sampleContent = `
================================================================================
계명대학교 한국어학당 (KEIMYUNG UNIVERSITY KOREAN LANGUAGE INSTITUTE)
공식 행정 양식: ${doc.title}
파일명: ${doc.fileName}
카테고리: ${doc.category}
발행처: 계명대학교 국제처 외국인학생지원팀 (동영관 101호)
문의: 053-580-6923~4 / kmu_intl@kmu.ac.kr
================================================================================

[ 안내 및 유의사항 ]
1. 본 서식은 계명대학교 한국어학당 정규과정 유학생의 행정 처리를 위한 공식 양식입니다.
2. 각 항목을 정확히 기재하신 후 지정된 제출 기한 내에 행정실로 제출해 주시기 바랍니다.
3. 기재 내용이 사실과 다를 경우 허가가 취소되거나 출입국 처벌을 받을 수 있습니다.

[ 신청인 기재란 ]
- 학번 (Student ID): ____________________
- 성명 (Full Name): ____________________
- 국적 (Nationality): ____________________
- 연락처 (Mobile): ____________________
- 체류자격 (Visa Type): D-4 / D-2
- 서명: ____________________

※ 세부 작성 요령은 본 포털의 FAQ 또는 담당 코디네이터(동영관 101호)에게 문의하세요.
================================================================================
`.trim();

  const blob = new Blob([sampleContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = doc.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
