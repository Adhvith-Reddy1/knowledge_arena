import { NextRequest, NextResponse } from 'next/server';
import { getTopics, createTopic } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  return NextResponse.json(getTopics());
}

export async function POST(req: NextRequest) {
  const { name, description, color } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const topic = {
    id: randomUUID(),
    name: name.trim(),
    description: (description ?? '').trim(),
    color: color ?? 'violet',
  };
  createTopic(topic);
  return NextResponse.json(topic, { status: 201 });
}
