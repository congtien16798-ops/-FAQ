import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ExportFaqPdfOptions {
  title: string;
  categoryName?: string;
  contentHtml: string;
  dateStr?: string;
  faqId?: string;
  lang?: string;
}

/**
 * Exports a FAQ post/article into a publication-quality PDF document and initiates download.
 */
export async function downloadFaqAsPdf(options: ExportFaqPdfOptions): Promise<boolean> {
  const {
    title,
    categoryName = '국민대학교 FAQ',
    contentHtml,
    dateStr = new Date().toLocaleDateString('ko-KR'),
    faqId,
    lang = 'ko',
  } = options;

  // Build temporary clean container styled specifically for A4 printing/rasterization
  const container = document.createElement('div');
  container.className = 'pdf-export-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-9999px';
  container.style.width = '794px'; // ~210mm at 96 DPI
  container.style.padding = '40px 48px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1e293b';
  container.style.fontFamily = "'Noto Sans KR', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  container.style.zIndex = '-9999';
  container.style.boxSizing = 'border-box';

  const shareUrl = faqId
    ? `${window.location.origin}${window.location.pathname}?faq=${encodeURIComponent(faqId)}`
    : window.location.href;

  const currentYear = new Date().getFullYear();

  container.innerHTML = `
    <div style="border-bottom: 2.5px solid #1A3B6B; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <div style="font-size: 11px; font-weight: 700; color: #1A3B6B; letter-spacing: 1px; text-transform: uppercase;">KOOKMIN UNIVERSITY</div>
        <div style="font-size: 16px; font-weight: 800; color: #0F172A; margin-top: 2px;">국민대학교 외국인유학생지원센터</div>
        <div style="font-size: 10px; color: #64748B; margin-top: 2px;">International Student Support Center • FAQ Guide</div>
      </div>
      <div style="text-align: right;">
        <span style="display: inline-block; background-color: #EEF3F9; color: #1A3B6B; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; border: 1px solid #CBD5E1;">
          ${categoryName}
        </span>
      </div>
    </div>

    <!-- Question Title -->
    <div style="margin-bottom: 16px;">
      <h1 style="font-size: 20px; font-weight: 800; color: #0F172A; line-height: 1.4; margin: 0 0 8px 0; word-break: break-word;">
        ${title}
      </h1>
      <div style="font-size: 11px; color: #64748B; display: flex; gap: 16px; align-items: center;">
        <span>최종 확인일: <strong>${dateStr}</strong></span>
        <span>•</span>
        <span>문서 형식: <strong>공식 안내문 (Official FAQ)</strong></span>
      </div>
    </div>

    <div style="height: 1px; background-color: #E2E8F0; margin-bottom: 24px;"></div>

    <!-- Body Content -->
    <div class="pdf-content-body" style="font-size: 13px; line-height: 1.7; color: #334155; word-break: break-word;">
      ${contentHtml}
    </div>

    <!-- Document Verification & Footer -->
    <div style="margin-top: 40px; padding-top: 16px; border-top: 1.5px dashed #CBD5E1; font-size: 10.5px; color: #64748B; line-height: 1.6;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
        <div style="flex: 1;">
          <div style="font-weight: 700; color: #1A3B6B; margin-bottom: 3px;">본 문서는 국민대학교 외국인유학생 FAQ 포털에서 다운로드된 공식 안내 자료입니다.</div>
          <div>실시간 최신 내용 확인 및 서식 다운로드: <span style="color: #2563EB; word-break: break-all;">${shareUrl}</span></div>
        </div>
        <div style="text-align: right; white-space: nowrap;">
          <div>발급 일시: ${new Date().toLocaleString(lang === 'vi' ? 'vi-VN' : lang === 'en' ? 'en-US' : 'ko-KR')}</div>
          <div style="color: #94A3B8; margin-top: 2px;">© ${currentYear} Kookmin University.</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Wait for any images inside the container to load
    const images = Array.from(container.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) resolve();
            else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }
          })
      )
    );

    // Rasterize container using html2canvas
    const canvas = await html2canvas(container, {
      scale: 2, // 2x high resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 12; // 12mm margins
    const contentWidth = pageWidth - margin * 2; // 186mm
    const contentHeight = pageHeight - margin * 2; // 273mm

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const pxPerMm = canvasWidth / contentWidth;
    const pageHeightPx = Math.floor(contentHeight * pxPerMm);

    let renderedHeightPx = 0;
    let pageIndex = 0;

    while (renderedHeightPx < canvasHeight) {
      const currentChunkHeightPx = Math.min(pageHeightPx, canvasHeight - renderedHeightPx);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvasWidth;
      pageCanvas.height = currentChunkHeightPx;
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, currentChunkHeightPx);
        ctx.drawImage(
          canvas,
          0,
          renderedHeightPx,
          canvasWidth,
          currentChunkHeightPx,
          0,
          0,
          canvasWidth,
          currentChunkHeightPx
        );
      }
      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
      if (pageIndex > 0) {
        pdf.addPage();
      }
      const chunkHeightMm = (currentChunkHeightPx * contentWidth) / canvasWidth;
      pdf.addImage(pageImgData, 'JPEG', margin, margin, contentWidth, chunkHeightMm);

      renderedHeightPx += currentChunkHeightPx;
      pageIndex++;
    }

    // Sanitize title for filename
    const cleanTitle = title
      .replace(/[\/\\?%*:|"<>]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 40);
    const fileName = `[국민대 FAQ] ${cleanTitle || '안내문'}.pdf`;

    pdf.save(fileName);
    return true;
  } catch (err) {
    console.error('PDF export failed:', err);
    return false;
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}
