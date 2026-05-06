import { NextRequest, NextResponse } from 'next/server';
import { deleteSource } from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteSource(id);
  return new NextResponse(null, { status: 204 });
}
