import { getRecipeLinks } from "@/app/actions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const rating = searchParams.get("rating") ? parseInt(searchParams.get("rating")!, 10) : undefined;
  const category = searchParams.get("category") || undefined;
  const page = parseInt(searchParams.get("page") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  try {
    const result = await getRecipeLinks(search, rating, category, page, limit);
    return Response.json(result);
  } catch {
    return Response.json({ rows: [], total: 0, page: 0, limit: 20, hasMore: false });
  }
}
