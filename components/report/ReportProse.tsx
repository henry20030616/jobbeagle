'use client';

import React from 'react';
import { BODY_COPY } from '@/components/guide/GuideSlideChrome';
import { splitProseSentences } from '@/lib/report-item-summaries';

const PROSE_WIDTH = 'max-w-[42rem]';

export function ReportProse({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const sentences = splitProseSentences(text);
  if (sentences.length === 0) return null;
  const wrap = className ? `${PROSE_WIDTH} ${className}` : PROSE_WIDTH;
  return (
    <div className={`${wrap} space-y-2 overflow-visible`}>
      {sentences.map((sentence, index) => (
        <p
          key={`${index}:${sentence}`}
          className={`${BODY_COPY} overflow-visible whitespace-normal break-words`}
        >
          {sentence}
        </p>
      ))}
    </div>
  );
}
