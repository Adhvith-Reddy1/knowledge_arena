import { NextRequest, NextResponse } from 'next/server';
import { createSource } from '@/lib/db';
import { scrapeUrl } from '@/lib/scraper';
import { randomUUID } from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: topicId } = await params;
  const { url } = await req.json();

  if (!url?.trim()) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const { title, text } = await scrapeUrl(parsed.href);

    const source = {
      id: randomUUID(),
      topic_id: topicId,
      type: 'url' as const,
      name: title,
      url: parsed.href,
      content: text,
      char_count: text.length,
    };

    createSource(source);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { content: _, ...meta } = source;
    return NextResponse.json(meta, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to scrape URL';
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
