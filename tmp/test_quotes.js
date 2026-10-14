function restoreOriginalSingleQuotes(originalText, translatedText) {
  if (!originalText || !translatedText || originalText === translatedText) return translatedText;

  const origMatches = [];
  const origRegex = /['‘`’]([^'’`\r\n]+)['’`]/g;
  let m;
  while ((m = origRegex.exec(originalText)) !== null) {
    origMatches.push(m[1].trim());
  }
  if (origMatches.length === 0) return translatedText;

  // Find quoted segments in translatedText (may be single, double, or smart quotes)
  const transMatches = [];
  const transRegex = /['‘`’"]([^'’`"\r\n]+)['’`"]/g;
  let tm;
  while ((tm = transRegex.exec(translatedText)) !== null) {
    transMatches.push({ full: tm[0], inner: tm[1].trim(), index: tm.index });
  }

  // If number of quotes matches, replace each in position from end to start
  if (transMatches.length === origMatches.length) {
    let replaced = translatedText;
    for (let i = transMatches.length - 1; i >= 0; i--) {
      const match = transMatches[i];
      const origWord = origMatches[i];
      replaced =
        replaced.slice(0, match.index) +
        `'${origWord}'` +
        replaced.slice(match.index + match.full.length);
    }
    return replaced;
  }

  // If quote count differs, ensure each original quote term is restored
  let result = translatedText;
  origMatches.forEach((origWord) => {
    if (!result.includes(`'${origWord}'`) && !result.includes(`‘${origWord}’`)) {
      if (result.includes(origWord)) {
        result = result.split(origWord).join(`'${origWord}'`);
      }
    }
  });

  return result;
}

const orig = " '전체동의' 체크 → '가입하기' 클릭 ";
const trans1 = " Check 'Agree to All' → Click 'Sign Up' ";
const trans2 = " Tích chọn '전체동의' → Nhấp vào '가입하기' ";
const trans3 = " 勾选 “전체동의” → 点击 “가입하기” ";

console.log("Original:", orig);
console.log("Trans1 (English translated quotes):", restoreOriginalSingleQuotes(orig, trans1));
console.log("Trans2 (Vietnamese correct):", restoreOriginalSingleQuotes(orig, trans2));
console.log("Trans3 (Chinese double quotes):", restoreOriginalSingleQuotes(orig, trans3));
