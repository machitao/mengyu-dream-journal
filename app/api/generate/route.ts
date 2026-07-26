import { headers } from "next/headers";

type GenerationKind = "analysis" | "scenes" | "novel" | "storyboard" | "image" | "video";

const demoResults: Record<GenerationKind, Record<string, unknown>> = {
  analysis: {
    psychology: { title: "一次向内靠近的邀请", confidence: "medium" },
    traditional: { title: "桥为通达，月为阴明", directSources: [], analogies: [] },
    synthesis: { theme: "过渡与重新开启" },
  },
  scenes: {
    scenes: [
      { id: "bridge", title: "月下长桥", sourceOnly: true },
      { id: "house", title: "森林旧宅", sourceOnly: true },
      { id: "stairs", title: "旋转楼梯", sourceOnly: true },
    ],
  },
  novel: { title: "云层下的钥匙", status: "outline-ready", inventedContentLabeled: true },
  storyboard: { title: "第一幕", shots: 4, inventedContentLabeled: true },
  image: { status: "queued", model: "wan2.7-image", estimatedCostFen: 20 },
  video: { status: "queued", model: "wan2.7-i2v", durationSeconds: 6 },
};

export async function POST(request: Request) {
  const requestHeaders = await headers();
  const owner = requestHeaders.get("oai-authenticated-user-email") ?? "local-preview@dream-island";
  const payload = (await request.json()) as {
    kind?: GenerationKind;
    dreamText?: string;
    context?: Record<string, unknown>;
    idempotencyKey?: string;
  };
  const kind = payload.kind;
  if (!kind || !(kind in demoResults)) {
    return Response.json({ error: "不支持的生成类型" }, { status: 400 });
  }

  const key = process.env.DASHSCOPE_API_KEY;
  if (key && ["analysis", "scenes", "novel", "storyboard"].includes(kind)) {
    const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen3.7-plus",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "你是梦屿的结构化创作助手。只返回 JSON。原始梦境、心理假设、古籍直接出处与艺术虚构必须分开；禁止把艺术虚构写回分析。",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: kind,
              dreamText: payload.dreamText ?? "",
              context: payload.context ?? {},
            }),
          },
        ],
      }),
    });
    if (response.ok) {
      const result = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = result.choices?.[0]?.message?.content;
      if (content) {
        return Response.json({
          jobId: crypto.randomUUID(),
          owner,
          provider: "dashscope",
          result: JSON.parse(content),
        });
      }
    }
  }

  return Response.json({
    jobId: crypto.randomUUID(),
    owner,
    provider: "private-demo",
    idempotencyKey: payload.idempotencyKey ?? crypto.randomUUID(),
    result: demoResults[kind],
  });
}
