import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, payload } = body;

    if (!type || !payload) {
      return NextResponse.json(
        { error: "type과 payload가 필요합니다." },
        { status: 400 }
      );
    }

    const id = nanoid(10);
    await prisma.sharedResult.create({
      data: {
        id,
        type,
        payload: JSON.stringify(payload),
      },
    });

    return NextResponse.json({ id, url: `/r/${id}` });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "공유 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
