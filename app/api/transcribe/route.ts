export async function POST(request: Request) {
  const form = await request.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File)) {
    return Response.json({ error: "缺少临时音频" }, { status: 400 });
  }
  if (audio.size > 10 * 1024 * 1024) {
    return Response.json({ error: "每段录音不能超过 10MB" }, { status: 413 });
  }

  // The file is intentionally not written to D1, R2, logs, or a temp directory.
  return Response.json({
    transcript: "",
    deleted: true,
    provider: process.env.DASHSCOPE_API_KEY ? "dashscope-ready" : "private-demo",
  });
}
