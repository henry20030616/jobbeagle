/**
 * Browser-side resume helpers. Extract Word text before upload so we never
 * POST multi‑MB DOCX base64 (Vercel request body ~4.5MB — truncates and breaks jszip).
 */

export async function extractDocxTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.doc') && !name.endsWith('.docx')) {
    throw new Error(
      'This older Word format (.doc) is not supported. Please save as .docx or PDF, or paste the text.',
    );
  }

  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  const text = (value || '').trim();
  if (!text) {
    throw new Error(
      "We couldn't read that Word file. Please try PDF, or paste the resume text.",
    );
  }
  return text;
}

export function isWordFileName(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type;
  return (
    type === 'application/msword'
    || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    || name.endsWith('.doc')
    || name.endsWith('.docx')
  );
}
