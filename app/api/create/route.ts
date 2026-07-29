const BASE_URL = "https://dashscope-us.aliyuncs.com";

function apiKey() {
  return process.env.DASHSCOPE_API_KEY?.trim();
}

function errorMessage(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const data = value as Record<string, unknown>;
    return String(data.message ?? data.error ?? data.code ?? "模型服务返回了未知错误");
  }
  return "模型服务返回了未知错误";
}

function findMediaUrl(value: unknown, kind: "image" | "video"): string | null {
  const extensions = kind === "image" ? /\.(png|jpe?g|webp)(\?|$)/i : /\.(mp4|mov|webm)(\?|$)/i;
  const visit = (node: unknown): string | null => {
    if (typeof node === "string" && /^https?:\/\//.test(node) && (extensions.test(node) || node.includes(kind))) return node;
    if (Array.isArray(node)) {
      for (const item of node) { const found = visit(item); if (found) return found; }
    } else if (node && typeof node === "object") {
      for (const item of Object.values(node as Record<string, unknown>)) { const found = visit(item); if (found) return found; }
    }
    return null;
  };
  return visit(value);
}

async function dashscope(path: string, init: RequestInit) {
  const key = apiKey();
  if (!key) return { response: null, data: null };
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export async function POST(request: Request) {
  if (!apiKey()) return Response.json({ code: "MODEL_NOT_CONFIGURED", error: "尚未配置阿里云百炼 API Key，真实生成不可用。" }, { status: 503 });
  const body = await request.json() as { kind?: "image" | "novel" | "video"; dream?: string; title?: string; emotion?: string; scene?: string; style?: string; ratio?: string; tone?: string; };
  if (!body.kind || !body.dream?.trim()) return Response.json({ error: "缺少梦境内容或生成类型" }, { status: 400 });

  if (body.kind === "novel") {
    const prompt = `请把下面的梦境改编成一篇完整、有文学性的中文短篇小说。\n要求：\n1. 约1200至1800字，有开端、发展、转折和结尾；\n2. 风格：${body.tone || "奇幻心理"}；\n3. 保留梦中的核心人物、场景与情绪，但允许合理补全；\n4. 不要进行心理诊断，不要解释梦；\n5. 标题使用《${body.title || "梦境小说"}》；\n6. 直接输出小说正文，不输出创作说明。\n\n原始梦境：${body.dream}`;
    const { response, data } = await dashscope("/compatible-mode/v1/chat/completions", { method: "POST", body: JSON.stringify({ model: "qwen-plus", messages: [{ role: "system", content: "你是专业中文小说家，擅长把梦境改编成完整短篇小说。" }, { role: "user", content: prompt }], temperature: 0.85 }) });
    if (!response?.ok) return Response.json({ error: errorMessage(data) }, { status: response?.status || 502 });
    const text = (data as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content;
    if (!text) return Response.json({ error: "模型没有返回小说正文" }, { status: 502 });
    return Response.json({ provider: "dashscope", model: "qwen-plus", text });
  }

  if (body.kind === "image") {
    const ratioSizes: Record<string, string> = { "16:9": "1792*1024", "9:16": "1024*1792", "1:1": "1328*1328" };
    const prompt = `根据私人梦境生成一幅高质量、无文字、无水印的艺术画面。梦境标题：${body.title || "未命名梦境"}。选定场景：${body.scene || body.dream}。完整梦境：${body.dream}。醒来情绪：${body.emotion || "未知"}。视觉风格：${body.style || "梦幻电影感"}。画面需要有明确主体、空间层次、电影级光影，避免拼贴、界面、文字、Logo。`;
    const { response, data } = await dashscope("/api/v1/services/aigc/multimodal-generation/generation", { method: "POST", body: JSON.stringify({ model: "wan2.6-t2i", input: { messages: [{ role: "user", content: [{ text: prompt }] }] }, parameters: { prompt_extend: true, watermark: false, n: 1, negative_prompt: "文字，水印，logo，界面，边框，低清晰度，畸形肢体", size: ratioSizes[body.ratio || "16:9"] || ratioSizes["16:9"] } }) });
    if (!response?.ok) return Response.json({ error: errorMessage(data) }, { status: response?.status || 502 });
    const url = findMediaUrl(data, "image");
    if (!url) return Response.json({ error: "模型完成了请求，但没有返回可用图片地址", rawStatus: (data as Record<string, unknown>).output }, { status: 502 });
    return Response.json({ provider: "dashscope", model: "wan2.6-t2i", url });
  }

  const ratioSizes: Record<string, string> = { "16:9": "1280*720", "9:16": "720*1280", "1:1": "960*960" };
  const prompt = `生成一段单镜头、电影感的梦境视频，无字幕、无文字、无Logo。梦境标题：${body.title || "未命名梦境"}。镜头内容：${body.scene || body.dream}。完整梦境背景：${body.dream}。醒来情绪：${body.emotion || "未知"}。镜头缓慢推进，动作自然，环境细节丰富，保持梦境般但视觉连贯。`;
  const { response, data } = await dashscope("/api/v1/services/aigc/video-generation/video-synthesis", { method: "POST", headers: { "X-DashScope-Async": "enable" }, body: JSON.stringify({ model: "wan2.6-t2v", input: { prompt }, parameters: { size: ratioSizes[body.ratio || "16:9"] || ratioSizes["16:9"], prompt_extend: true, duration: 5 } }) });
  if (!response?.ok) return Response.json({ error: errorMessage(data) }, { status: response?.status || 502 });
  const taskId = (data as { output?: { task_id?: string }; task_id?: string }).output?.task_id ?? (data as { task_id?: string }).task_id;
  if (!taskId) return Response.json({ error: "视频模型没有返回任务编号" }, { status: 502 });
  return Response.json({ provider: "dashscope", model: "wan2.6-t2v", taskId, status: "PENDING" });
}

export async function GET(request: Request) {
  if (!apiKey()) return Response.json({ code: "MODEL_NOT_CONFIGURED", error: "尚未配置阿里云百炼 API Key。" }, { status: 503 });
  const taskId = new URL(request.url).searchParams.get("taskId");
  if (!taskId || !/^[A-Za-z0-9_-]+$/.test(taskId)) return Response.json({ error: "无效的视频任务编号" }, { status: 400 });
  const { response, data } = await dashscope(`/api/v1/tasks/${taskId}`, { method: "GET" });
  if (!response?.ok) return Response.json({ error: errorMessage(data) }, { status: response?.status || 502 });
  const output = (data as { output?: Record<string, unknown> }).output ?? {};
  const status = String(output.task_status ?? output.status ?? "UNKNOWN");
  const url = findMediaUrl(data, "video");
  return Response.json({ taskId, status, url, error: output.message ?? null });
}

