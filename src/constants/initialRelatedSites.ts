import { RelatedSite } from '../types';

export const DEFAULT_RELATED_SITES: RelatedSite[] = [
  {
    id: 'site-hikorea',
    name: '하이코리아',
    nameEn: 'Hi Korea',
    url: 'https://www.hikorea.go.kr',
    badge: '정부포털',
    desc: '대한민국 전자정부 외국인종합안내포털 (체류기간 연장, 외국인등록, 시간제취업 허가)',
  },
  {
    id: 'site-topik',
    name: 'TOPIK',
    nameEn: 'TOPIK Official',
    url: 'https://www.topik.go.kr',
    badge: '시험접수',
    desc: '국립국제교육원 TOPIK 공식 시험 일정 접수 및 성적증명서 발급',
  },
  {
    id: 'site-studyinkorea',
    name: '스터디인코리아',
    nameEn: 'Study in Korea',
    url: 'https://www.studyinkorea.go.kr',
    badge: '한국유학',
    desc: '교육부 국립국제교육원 한국유학 종합시스템 (장학금, 입학 정보, 대학 안내)',
  },
];
