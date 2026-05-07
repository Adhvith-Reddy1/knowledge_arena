import { NextRequest, NextResponse } from 'next/server';
import { createSource } from '@/lib/db';
import { parsePdf, parsePptx, parseText } from '@/lib/fileParser';
import { randomUUID } from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: topicId } = await params;

  const form = await req.formData();
  const file = form.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  let text: string;
  try {
    if (ext === 'pdf') {
      text = await parsePdf(buffer);
    } else if (['pptx', 'ppt'].includes(ext)) {
      text = await parsePptx(buffer);
    } else if (['txt', 'md', 'markdown'].includes(ext)) {
      text = parseText(buffer);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Use PDF, PPTX, PPT, TXT, or MD.' },
        { status: 400 }
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to parse file';
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  if (!text.trim()) {
    return NextResponse.json({ error: 'No readable text found in file' }, { status: 422 });
  }

  const source = {
    id: randomUUID(),
    topic_id: topicId,
    type: 'file' as const,
    name: file.name,
    url: null,
    content: text,
    char_count: text.length,
  };

  createSource(source);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { content: _, ...meta } = source;
  return NextResponse.json(meta, { status: 201 });
}
