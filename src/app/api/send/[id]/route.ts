import { NextRequest, NextResponse } from "next/server";
import { ACTION } from "#/lib/constants";
import { pusher } from "#/lib/pusher";

interface Extras {
	params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Extras) {
	const { id } = await params;
	const req = await request.json();

	await pusher.trigger(id, ACTION.INSCRIPTION, req);

	return NextResponse.json({ msg: "SENT" });
}
