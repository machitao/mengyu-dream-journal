import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "../../../db";
import { dreams } from "../../../db/schema";

async function ownerId() {
  const requestHeaders = await headers();
  return requestHeaders.get("oai-authenticated-user-email") ?? "local-preview@dream-island";
}

function mapDream(row: typeof dreams.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    month: row.month,
    day: row.day,
    content: row.editableText,
    summary: row.summary,
    emotion: row.emotion,
    intensity: row.intensity,
    tags: row.tags,
  };
}

export async function GET() {
  try {
    const owner = await ownerId();
    const rows = await getDb()
      .select()
      .from(dreams)
      .where(and(eq(dreams.owner, owner), eq(dreams.status, "active")))
      .orderBy(desc(dreams.createdAt))
      .limit(200);
    return Response.json({ dreams: rows.map(mapDream) });
  } catch {
    return Response.json({ dreams: [] });
  }
}

export async function POST(request: Request) {
  const owner = await ownerId();
  const payload = (await request.json()) as {
    id?: string;
    title?: string;
    date?: string;
    month?: string;
    day?: string;
    content?: string;
    summary?: string;
    emotion?: string;
    intensity?: number;
    tags?: string[];
  };
  const content = payload.content?.trim() ?? "";
  if (!content) return Response.json({ error: "梦境内容不能为空" }, { status: 400 });
  const now = new Date().toISOString();
  const row: typeof dreams.$inferInsert = {
    id: payload.id ?? crypto.randomUUID(),
    owner,
    title: payload.title?.trim() || "未命名的梦",
    date: payload.date ?? now,
    month: payload.month ?? "",
    day: payload.day ?? "",
    rawText: content,
    editableText: content,
    summary: payload.summary ?? content.slice(0, 80),
    emotion: payload.emotion ?? "未标记",
    intensity: Math.min(10, Math.max(1, payload.intensity ?? 5)),
    tags: payload.tags ?? [],
    context: {},
    createdAt: now,
  };
  try {
    const [created] = await getDb().insert(dreams).values(row).returning();
    return Response.json({ dream: mapDream(created) }, { status: 201 });
  } catch {
    return Response.json({ dream: mapDream(row as typeof dreams.$inferSelect), stored: false }, { status: 202 });
  }
}

export async function DELETE(request: Request) {
  const owner = await ownerId();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "缺少梦境 id" }, { status: 400 });
  await getDb()
    .update(dreams)
    .set({ status: "trash", deletedAt: new Date().toISOString() })
    .where(and(eq(dreams.id, id), eq(dreams.owner, owner)));
  return Response.json({ ok: true, purgeAfterDays: 7 });
}
