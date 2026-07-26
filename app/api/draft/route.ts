import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "../../../db";
import { dreamDrafts } from "../../../db/schema";

async function ownerId() {
  const requestHeaders = await headers();
  return requestHeaders.get("oai-authenticated-user-email") ?? "local-preview@dream-island";
}

export async function GET() {
  try {
    const owner = await ownerId();
    const [draft] = await getDb()
      .select()
      .from(dreamDrafts)
      .where(eq(dreamDrafts.owner, owner))
      .limit(1);
    return Response.json({ draft: draft ?? null });
  } catch {
    return Response.json({ draft: null });
  }
}

export async function PUT(request: Request) {
  const owner = await ownerId();
  const payload = (await request.json()) as {
    content?: string;
    emotion?: string;
    context?: Record<string, unknown>;
  };
  const content = payload.content?.trim() ?? "";
  if (!content) {
    return Response.json({ error: "草稿内容不能为空" }, { status: 400 });
  }
  const updatedAt = new Date().toISOString();
  const row: typeof dreamDrafts.$inferInsert = {
    owner,
    content,
    emotion: payload.emotion ?? "未标记",
    context: payload.context ?? {},
    updatedAt,
  };
  try {
    await getDb()
      .insert(dreamDrafts)
      .values(row)
      .onConflictDoUpdate({
        target: dreamDrafts.owner,
        set: {
          content: row.content,
          emotion: row.emotion,
          context: row.context,
          updatedAt,
        },
      });
    return Response.json({ draft: row });
  } catch {
    return Response.json({ draft: row, stored: false }, { status: 202 });
  }
}

export async function DELETE() {
  try {
    const owner = await ownerId();
    await getDb().delete(dreamDrafts).where(eq(dreamDrafts.owner, owner));
  } catch {
    // Local UI preview has no D1 binding; the device copy is still cleared.
  }
  return Response.json({ ok: true });
}
