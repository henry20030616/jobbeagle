/**
 * Presentation helpers for Interview Strategy Guide cards.
 * Does not change FullReport / API shapes — only splits strings the model already returns.
 */

export interface StarCells {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface DoDontPair {
  doSay: string;
  dontSay: string;
}

function trimCell(value: string): string {
  return value.replace(/^[\s:·\-–—]+/, '').replace(/\s+/g, ' ').trim();
}

export function parseStarBlueprint(raw: string | undefined): StarCells {
  const text = (raw ?? '').trim();
  const empty: StarCells = { situation: '', task: '', action: '', result: '' };
  if (!text) return empty;

  const labeled =
    /(?:^|[.\n]|·)\s*S(?:ituation)?\s*[:\-–—]\s*([\s\S]*?)(?=(?:^|[.\n]|·)\s*T(?:ask)?\s*[:\-–—]|$)/i.exec(
      `\n${text}`,
    );
  const task =
    /(?:^|[.\n]|·)\s*T(?:ask)?\s*[:\-–—]\s*([\s\S]*?)(?=(?:^|[.\n]|·)\s*A(?:ction)?\s*[:\-–—]|$)/i.exec(
      `\n${text}`,
    );
  const action =
    /(?:^|[.\n]|·)\s*A(?:ction)?\s*[:\-–—]\s*([\s\S]*?)(?=(?:^|[.\n]|·)\s*R(?:esult)?\s*[:\-–—]|$)/i.exec(
      `\n${text}`,
    );
  const result =
    /(?:^|[.\n]|·)\s*R(?:esult)?\s*[:\-–—]\s*([\s\S]*?)$/i.exec(`\n${text}`);

  const cells: StarCells = {
    situation: labeled ? trimCell(labeled[1] ?? '') : '',
    task: task ? trimCell(task[1] ?? '') : '',
    action: action ? trimCell(action[1] ?? '') : '',
    result: result ? trimCell(result[1] ?? '') : '',
  };

  if (cells.situation || cells.task || cells.action || cells.result) {
    return cells;
  }

  return { ...empty, action: text };
}

export function parseDosDonts(raw: string | undefined): DoDontPair {
  const text = (raw ?? '').trim();
  if (!text) return { doSay: '', dontSay: '' };

  const split = text.match(
    /^(.*?)(?:[;.]?\s*)((?:do not|don't|不要|勿|禁止)[\s\S]+)$/i,
  );
  if (split) {
    return {
      doSay: trimCell(split[1] ?? ''),
      dontSay: trimCell(split[2] ?? ''),
    };
  }

  if (/^(do not|don't|不要|勿|禁止)/i.test(text)) {
    return { doSay: '', dontSay: text };
  }

  return { doSay: text, dontSay: '' };
}

export function formatIceBreaker(headline: string, askHint: string): string {
  const hook = headline.replace(/\s+/g, ' ').trim();
  if (!hook) return askHint.trim();
  const clipped = hook.length > 88 ? `${hook.slice(0, 85).trim()}…` : hook;
  return `“${clipped}” — ${askHint.trim()}`;
}

export function stripEngineerJargon(raw: string): string {
  return raw
    .replace(/RAG citation(?: count)?\s*[:\-–—]?\s*/gi, '')
    .replace(/Source:\s*System Analysis\s*[:\-–—]?\s*/gi, '')
    .replace(/\bSystem Analysis\b/gi, '')
    .replace(/\s+—\s+/g, ' — ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/^[\s—–-]+/, '')
    .trim();
}
