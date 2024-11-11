import { NextResponse } from "next/server";

export function GET(request) {
  NextResponse.json({ name: 'John Doe' }, { status: 200 });
}
