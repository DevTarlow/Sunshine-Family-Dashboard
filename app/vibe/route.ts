import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const VIBE_PATH = path.join(process.cwd(), "public", "Vibe", "vibe-of-the-day-photo.jpg");

export async function GET() {
  try {
    const buffer = await fs.readFile(VIBE_PATH);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
