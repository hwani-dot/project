import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const row = await prisma.sharedResult.findUnique({
    where: { id },
  });
  if (!row) {
    return NextResponse.json({ error: "공유된 결과를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({
    type: row.type,
    payload: JSON.parse(row.payload),
    createdAt: row.createdAt,
  });
}
