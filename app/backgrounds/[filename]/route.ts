import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Security: reject path traversal attempts
  if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const bgDir = path.join(process.cwd(), "public", "backgrounds");
  const filePath = path.join(bgDir, filename);

  // Ensure resolved path is inside the backgrounds directory
  if (!filePath.startsWith(bgDir + path.sep)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
