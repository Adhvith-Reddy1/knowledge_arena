import { NextRequest, NextResponse } from 'next/server';
import { deleteTopic, getTopicById } from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!getTopicById(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  deleteTopic(id);
  return new NextResponse(null, { status: 204 });
}
