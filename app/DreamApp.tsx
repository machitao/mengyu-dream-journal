"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type View = "record" | "library" | "insights" | "settings";
type DetailTab = "analysis" | "creative" | "original";
type ReportTab = "psychology" | "traditional" | "synthesis";
type CreativeMode = "image" | "novel" | "film";
type InputMode = "text" | "keywords";

type Dream = {
  id: string;
  title: string;
  date: string;
  month: string;
  day: string;
  content: string;
  summary: string;
  emotion: string;
  intensity: number;
  tags: string[];
  analysisStatus?: "none" | "ready";
};

const demoDreams: Dream[] = [
  {
    id: "d1",
    title: "月光下的无尽长桥",
    date: "7月26日 · 06:42",
    month: "七月",
    day: "26",
    content:
      "我走在一座看不到尽头的石桥上，桥下不是水，而是一片缓慢移动的云。月亮离我很近，像一盏旧灯。走到桥中央时，我看见小时候的自己站在对面，手里拿着一把生锈的钥匙。她没有说话，只是指向桥下。我向下看，云层裂开，露出一座被森林吞没的老房子。醒来前，我正在沿一段旋转楼梯向下走。",
    summary: "长桥、童年自我与藏在云层下的老房子，构成一次向内的旅程。",
    emotion: "好奇",
    intensity: 8,
    tags: ["月亮", "桥", "童年", "老房子"],
  },
  {
    id: "d2",
    title: "会呼吸的森林",
    date: "7月22日 · 07:10",
    month: "七月",
    day: "22",
    content: "森林里的树随着我的呼吸明暗起伏，一只白鹿引我走向没有门的房间。",
    summary: "白鹿穿过随呼吸明暗的森林，引向一间无门之屋。",
    emotion: "平静",
    intensity: 6,
    tags: ["森林", "白鹿", "房间"],
  },
  {
    id: "d3",
    title: "倒流的车站",
    date: "7月17日 · 05:58",
    month: "七月",
    day: "17",
    content: "站台上的钟都在倒转，每辆列车载着我认识却叫不出名字的人。",
    summary: "时间逆行的车站里，熟悉而陌生的人不断抵达。",
    emotion: "焦虑",
    intensity: 7,
    tags: ["车站", "时间", "人群"],
  },
  {
    id: "d4",
    title: "漂浮的蓝色房间",
    date: "7月11日 · 06:25",
    month: "七月",
    day: "11",
    content: "蓝色房间漂浮在海面上，我能听见墙后有人翻动旧照片。",
    summary: "海上的蓝色房间保存着看不见的旧照片。",
    emotion: "怀念",
    intensity: 5,
    tags: ["海", "房间", "照片"],
  },
  {
    id: "d5",
    title: "雨中的纸船",
    date: "7月03日 · 07:32",
    month: "七月",
    day: "03",
    content: "我把一句没有说出口的话折成纸船，它沿着雨水驶进城市深处。",
    summary: "未说出口的话化为纸船，在雨中离开。",
    emotion: "释然",
    intensity: 4,
    tags: ["雨", "纸船", "城市"],
  },
];

const navItems: { id: View; icon: string; label: string }[] = [
  { id: "record", icon: "✦", label: "记录" },
  { id: "library", icon: "▤", label: "梦册" },
  { id: "insights", icon: "◌", label: "洞察" },
  { id: "settings", icon: "⚙", label: "设置" },
];

export function DreamApp() {
  const [view, setView] = useState<View>("record");
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [detail, setDetail] = useState<Dream | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("analysis");
  const [reportTab, setReportTab] = useState<ReportTab>("psychology");
  const [creativeMode, setCreativeMode] = useState<CreativeMode>("image");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [contextOpen, setContextOpen] = useState(false);
  const [emotion, setEmotion] = useState("好奇");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [toast, setToast] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    navigator.serviceWorker?.register("/sw.js").catch(() => undefined);
    const draft = window.localStorage.getItem("dream-island-draft");
    if (draft) setText(draft);
    const preview = new URLSearchParams(window.location.search).get("preview");
    const previewMode = Boolean(preview);
    if (previewMode) setDreams(demoDreams);
    if (preview === "library" || preview === "insights" || preview === "settings") {
      setView(preview);
    }
    if (preview === "analysis" || preview === "traditional" || preview === "synthesis") {
      setDetail(demoDreams[0]);
      setDetailTab("analysis");
      setReportTab(
        preview === "traditional"
          ? "traditional"
          : preview === "synthesis"
            ? "synthesis"
            : "psychology",
      );
    }
    if (preview === "image" || preview === "novel" || preview === "film") {
      setDetail(demoDreams[0]);
      setDetailTab("creative");
      setCreativeMode(preview);
    }
    fetch("/api/dreams")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { dreams?: Dream[] }) => {
        if (!previewMode || data.dreams?.length) setDreams(data.dreams ?? []);
      })
      .catch(() => undefined);
    fetch("/api/draft")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { draft?: { content?: string; emotion?: string } | null }) => {
        if (!draft && data.draft?.content) {
          setText(data.draft.content);
          if (data.draft.emotion) setEmotion(data.draft.emotion);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      window.localStorage.setItem("dream-island-draft", text);
    }, 350);
    return () => window.clearTimeout(id);
  }, [text]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const openDream = (dream: Dream) => {
    setDetail(dream);
    setDetailTab("analysis");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeView = (next: View) => {
    setDetail(null);
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleRecord = async () => {
    if (recording) {
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setToast("录音已结束，临时音频将在转写后删除");
      if (!text) {
        setText("我走在一条很长的桥上，月亮就在前方。桥的另一端，小时候的我拿着一把钥匙等我。");
      }
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((current) => {
          if (current >= 299) {
            if (timerRef.current) clearInterval(timerRef.current);
            setRecording(false);
            return 300;
          }
          return current + 1;
        });
      }, 1000);
    } catch {
      setToast("请允许麦克风权限后再开始录音");
    }
  };

  const saveForLater = () => {
    if (!text.trim()) {
      setToast("先写下或说出你记得的梦");
      return;
    }
    window.localStorage.setItem("dream-island-draft", text);
    setToast("正在保存当前梦境草稿");
    fetch("/api/draft", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: text, emotion }),
    })
      .then((response) => {
        setToast(
          response.ok
            ? "草稿已保存；可在电脑或手机继续编辑"
            : "草稿已保存在当前设备",
        );
      })
      .catch(() => setToast("草稿已保存在当前设备"));
  };

  const startDeepAnalysis = async () => {
    if (!text.trim()) {
      setToast("梦境内容不能为空");
      return;
    }
    const now = new Date();
    const created: Dream = {
      id: crypto.randomUUID(),
      title: text.includes("桥") ? "月光尽头的桥" : "刚刚记下的梦",
      date: `${now.getMonth() + 1}月${now.getDate()}日 · ${now
        .toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}`,
      month: `${now.getMonth() + 1}月`,
      day: String(now.getDate()).padStart(2, "0"),
      content: text.trim(),
      summary: text.trim().slice(0, 56),
      emotion,
      intensity: 7,
      tags: ["新梦", emotion],
      analysisStatus: "ready",
    };
    setDreams((items) => [created, ...items]);
    setText("");
    window.localStorage.removeItem("dream-island-draft");
    fetch("/api/draft", { method: "DELETE" }).catch(() => undefined);
    setToast("梦境已定稿，正在开始深度分析");
    fetch("/api/dreams", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(created),
    }).catch(() => undefined);
    window.setTimeout(() => openDream(created), 400);
  };

  return (
    <main className="app-shell">
      {toast && <div className="toast">{toast}</div>}
      <header className="topbar">
        <button className="brand" onClick={() => changeView("record")} aria-label="返回记录首页">
          <span className="brand-mark">☾</span>
          <span>梦屿</span>
        </button>
        <div className="privacy-pill">
          <span>⌾</span>
          <span>仅你可见 · 已加密</span>
        </div>
      </header>

      {detail ? (
        <DreamDetail
          dream={detail}
          tab={detailTab}
          setTab={setDetailTab}
          reportTab={reportTab}
          setReportTab={setReportTab}
          creativeMode={creativeMode}
          setCreativeMode={setCreativeMode}
          goBack={() => setDetail(null)}
          notify={setToast}
        />
      ) : (
        <>
          {view === "record" && (
            <RecordView
              dreams={dreams}
              inputMode={inputMode}
              setInputMode={setInputMode}
              text={text}
              setText={setText}
              contextOpen={contextOpen}
              setContextOpen={setContextOpen}
              emotion={emotion}
              setEmotion={setEmotion}
              recording={recording}
              seconds={seconds}
              toggleRecord={toggleRecord}
              saveDream={saveForLater}
              analyzeDream={startDeepAnalysis}
              openDream={openDream}
              showLibrary={() => changeView("library")}
            />
          )}
          {view === "library" && <LibraryView dreams={dreams} openDream={openDream} />}
          {view === "insights" && <InsightsView dreams={dreams} />}
          {view === "settings" && <SettingsView notify={setToast} />}
        </>
      )}

      {!detail && (
        <nav className="bottom-nav" aria-label="主要导航">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => changeView(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </main>
  );
}

function RecordView({
  dreams,
  inputMode,
  setInputMode,
  text,
  setText,
  contextOpen,
  setContextOpen,
  emotion,
  setEmotion,
  recording,
  seconds,
  toggleRecord,
  saveDream,
  analyzeDream,
  openDream,
  showLibrary,
}: {
  dreams: Dream[];
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  text: string;
  setText: (value: string) => void;
  contextOpen: boolean;
  setContextOpen: (value: boolean) => void;
  emotion: string;
  setEmotion: (value: string) => void;
  recording: boolean;
  seconds: number;
  toggleRecord: () => void;
  saveDream: () => void;
  analyzeDream: () => void;
  openDream: (dream: Dream) => void;
  showLibrary: () => void;
}) {
  const [activeContext, setActiveContext] = useState<string | null>(null);
  const [contextNotes, setContextNotes] = useState<Record<string, string>>({});
  const contextPrompts: Record<string, string> = {
    工作压力: "最近哪件工作最让你挂心？",
    重要关系: "这段关系最近发生了什么，或让你有什么感受？",
    正在做决定: "你正在权衡什么？最难取舍的部分是什么？",
    睡眠不足: "最近大约睡多久？入睡或醒来有什么变化？",
    生活变化: "近期有哪些搬迁、离别、开始或身份变化？",
  };
  const dateText = useMemo(
    () =>
      new Intl.DateTimeFormat("zh-CN", {
        month: "long",
        day: "numeric",
        weekday: "long",
      }).format(new Date()),
    [],
  );
  return (
    <>
      <section className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">醒来后的第一件事</div>
          <h1>
            梦还在吗？
            <br />
            <em>把它留住。</em>
          </h1>
          <p className="hero-subtitle">
            不急着解释，也不必完整。记下一幅画面、一种感受，或者梦里没有说完的那句话。
          </p>
          <div className="today-note">
            <div className="moon-orbit" />
            <span>
              已连续记梦 8 天
              <br />
              本月共收藏 12 个梦
            </span>
          </div>
        </div>

        <div className="record-card">
          <div className="date-row">
            <span>{dateText}</span>
            <span className="draft-state">{text ? "草稿已存于本机" : "等待记录"}</span>
          </div>
          {inputMode === "text" && (
            <>
              <textarea
                className="dream-textarea"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="我在一个很长的车站里……"
                aria-label="梦境内容"
              />
              <button
                className={`voice-strip ${recording ? "recording" : ""}`}
                onClick={toggleRecord}
                aria-label={recording ? "停止语音记录并转写" : "开始语音记录"}
              >
                <span className="mic-icon" aria-hidden="true" />
                {recording
                  ? `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")} · 结束并转写`
                  : "开始语音记录"}
              </button>
            </>
          )}
          {inputMode === "keywords" && (
            <div className="keyword-box">
              <span className="field-label">只写还记得的词，用顿号隔开即可</span>
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="月亮、车站、奔跑、害怕……"
                aria-label="梦境关键词"
              />
              <div className="keyword-suggestions">
                {["一个人", "旧房子", "水", "动物", "坠落", "找不到路"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setText(text ? `${text.replace(/[、，,\s]+$/, "")}、${item}` : item)}
                  >
                    ＋ {item}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button className="context-toggle" onClick={() => setContextOpen(!contextOpen)}>
            {contextOpen ? "－ 收起现实背景" : "＋ 添加一点现实背景（可选）"}
          </button>
          {contextOpen && (
            <div className="context-panel">
              <div>
                <span className="field-label">醒来时最明显的感受</span>
                <div className="chip-row">
                  {["好奇", "平静", "焦虑", "怀念", "喜悦", "恐惧"].map((item) => (
                    <button
                      key={item}
                      className={`chip ${emotion === item ? "selected" : ""}`}
                      onClick={() => setEmotion(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="field-label">近期状态</span>
                <div className="chip-row">
                  {["工作压力", "重要关系", "正在做决定", "睡眠不足", "生活变化"].map((item) => (
                    <button
                      className={`chip ${activeContext === item ? "selected" : ""}`}
                      key={item}
                      onClick={() => setActiveContext(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                {activeContext && (
                  <div className="context-detail">
                    <label htmlFor="context-note">
                      补充「{activeContext}」
                      <span>这些内容只用于理解你的梦，不会出现在艺术改编中。</span>
                    </label>
                    <textarea
                      id="context-note"
                      value={contextNotes[activeContext] ?? ""}
                      onChange={(event) =>
                        setContextNotes({
                          ...contextNotes,
                          [activeContext]: event.target.value,
                        })
                      }
                      placeholder={contextPrompts[activeContext]}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="record-actions">
            <button
              className={inputMode === "keywords" ? "active" : ""}
              onClick={() => setInputMode(inputMode === "keywords" ? "text" : "keywords")}
            >
              {inputMode === "keywords" ? "写完整梦境" : "只记关键词"}
            </button>
            <button onClick={saveDream}>保存，继续睡</button>
          </div>
          <button className="deep-analysis-button" onClick={analyzeDream}>
            <span>◎</span>
            <span>
              <b>深度分析梦境</b>
              <small>生成心理探索、传统梦象与综合启示</small>
            </span>
            <span>→</span>
          </button>
        </div>
      </section>

      <section className="home-preview">
        <div className="section-head">
          <div>
            <h2>最近的梦</h2>
            <p>每个梦都留着通往自己的线索</p>
          </div>
          <button className="text-button" onClick={showLibrary}>
            查看梦册 →
          </button>
        </div>
        <div className="recent-grid">
          {dreams.slice(0, 3).map((dream) => (
            <button className="dream-card" key={dream.id} onClick={() => openDream(dream)}>
              <span className="dream-date">{dream.date}</span>
              <h3>{dream.title}</h3>
              <p>{dream.summary}</p>
              <div className="chip-row">
                {dream.tags.slice(0, 3).map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
          {dreams.length === 0 && (
            <div className="home-empty">
              <span>☾</span>
              <div>
                <h3>第一段梦正在等你留下</h3>
                <p>夜里可以先保存草稿，清醒后补充完整，再主动开始深度分析。</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function LibraryView({ dreams, openDream }: { dreams: Dream[]; openDream: (dream: Dream) => void }) {
  const [query, setQuery] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState({ year: 2026, month: 6 });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const monthLabel = `${calendarMonth.year} 年 ${calendarMonth.month + 1} 月`;
  const firstWeekday = new Date(calendarMonth.year, calendarMonth.month, 1).getDay();
  const daysInMonth = new Date(calendarMonth.year, calendarMonth.month + 1, 0).getDate();
  const dreamDays =
    calendarMonth.year === 2026 && calendarMonth.month === 6
      ? new Set(dreams.map((dream) => Number(dream.day)))
      : new Set<number>();
  const filtered = dreams.filter((dream) => {
    const matchesQuery = `${dream.title}${dream.content}${dream.tags.join("")}`.includes(query);
    const matchesDate =
      selectedDay === null ||
      (calendarMonth.year === 2026 &&
        calendarMonth.month === 6 &&
        Number(dream.day) === selectedDay);
    return matchesQuery && matchesDate;
  });
  const changeMonth = (step: number) => {
    const next = new Date(calendarMonth.year, calendarMonth.month + step, 1);
    setCalendarMonth({ year: next.getFullYear(), month: next.getMonth() });
    setSelectedDay(null);
  };
  return (
    <section className="page">
      <div className="page-title">
        <div className="eyebrow">你的私人梦境档案</div>
        <h1>梦册</h1>
        <p>{dreams.length} 个梦，安静地收藏在这里。</p>
      </div>
      <div className="library-tools">
        <input
          className="search-box"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索人物、场景、情绪或梦象"
          aria-label="搜索梦境"
        />
        <button
          className={`calendar-trigger ${calendarOpen ? "active" : ""}`}
          onClick={() => setCalendarOpen(!calendarOpen)}
          aria-expanded={calendarOpen}
        >
          ◫ 造梦日历
        </button>
      </div>
      {calendarOpen && (
        <div className="dream-calendar">
          <div className="calendar-head">
            <button onClick={() => changeMonth(-1)} aria-label="上一个月">
              ←
            </button>
            <div>
              <b>{monthLabel}</b>
              <span>有圆点的日期记录过梦</span>
            </div>
            <button onClick={() => changeMonth(1)} aria-label="下一个月">
              →
            </button>
          </div>
          <div className="calendar-weekdays">
            {["日", "一", "二", "三", "四", "五", "六"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {Array.from({ length: firstWeekday }).map((_, index) => (
              <span className="calendar-blank" key={`blank-${index}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const hasDream = dreamDays.has(day);
              return (
                <button
                  key={day}
                  className={`${hasDream ? "has-dream" : ""} ${selectedDay === day ? "selected" : ""}`}
                  onClick={() => setSelectedDay(day)}
                  aria-label={`${calendarMonth.month + 1}月${day}日${hasDream ? "，有梦境记录" : "，没有梦境记录"}`}
                >
                  <span>{day}</span>
                  {hasDream && <i />}
                </button>
              );
            })}
          </div>
          <div className="calendar-foot">
            <span>
              {selectedDay
                ? `正在查看 ${calendarMonth.month + 1} 月 ${selectedDay} 日`
                : `本月记录了 ${dreamDays.size} 个梦`}
            </span>
            {selectedDay && (
              <button onClick={() => setSelectedDay(null)}>查看全部日期</button>
            )}
          </div>
        </div>
      )}
      <div className="library-list">
        {filtered.map((dream) => (
          <button className="library-row" key={dream.id} onClick={() => openDream(dream)}>
            <span className="date-block">
              <b>{dream.day}</b>
              <small>{dream.month}</small>
            </span>
            <span>
              <h3>{dream.title}</h3>
              <p>
                {dream.emotion} · 强度 {dream.intensity}/10 · {dream.tags.join("、")}
              </p>
            </span>
            <span className="row-arrow">›</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="library-empty">
            <b>这一天没有记录梦</b>
            <p>也许那晚睡得很沉。可以换一个有圆点的日期看看。</p>
          </div>
        )}
      </div>
    </section>
  );
}

function InsightsView({ dreams }: { dreams: Dream[] }) {
  if (dreams.length < 5) {
    return (
      <section className="page">
        <div className="page-title">
          <div className="eyebrow">看见反复出现的线索</div>
          <h1>长期洞察</h1>
          <p>只使用你的原始梦境与现实背景，不读取艺术改编内容。</p>
        </div>
        <div className="insight-locked">
          <span>◌</span>
          <div>
            <div className="report-label">累计 5 个梦后开放</div>
            <h2>再记录 {5 - dreams.length} 个梦，就能看见长期变化</h2>
            <p>届时会展示重复人物、地点、情绪、梦象，以及 30/90 天的变化趋势，并回链到对应梦境。</p>
            <div className="insight-progress"><i style={{ width: `${dreams.length * 20}%` }} /></div>
            <small>当前 {dreams.length} / 5</small>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="page">
      <div className="page-title">
        <div className="eyebrow">看见反复出现的线索</div>
        <h1>长期洞察</h1>
        <p>只使用你的原始梦境与现实背景，不读取艺术改编内容。</p>
      </div>
      <div className="insight-hero">
        <small>过去 30 天 · AI 综合观察</small>
        <h2>你似乎正在练习靠近那些曾被搁置的感受，而不是继续绕开它们。</h2>
        <div className="stat-row">
          <div className="stat">
            <b>{dreams.length}</b>
            <span>记录的梦</span>
          </div>
          <div className="stat">
            <b>4</b>
            <span>重复梦象</span>
          </div>
          <div className="stat">
            <b>6.2</b>
            <span>平均强度</span>
          </div>
        </div>
      </div>
      <div className="panel-card emotion-trend-card">
        <div className="trend-heading">
          <div>
            <span className="report-label">过去 8 周</span>
            <h3>梦中情绪趋势</h3>
          </div>
          <div className="trend-legend">
            <span><i className="calm" /> 安定与好奇</span>
            <span><i className="tense" /> 紧张与迷失</span>
          </div>
        </div>
        <div className="trend-chart" aria-label="过去八周梦境情绪趋势示意图">
          {[25, 50, 75].map((value) => (
            <span className="trend-gridline" style={{ bottom: `${value}%` }} key={value}>
              <small>{value}</small>
            </span>
          ))}
          <div className="trend-area calm" />
          <div className="trend-area tense" />
          {[38, 52, 47, 61, 66, 58, 74, 82].map((value, index) => (
            <i
              className="trend-point calm"
              key={`calm-${index}`}
              style={{ left: `${4 + index * 13.1}%`, bottom: `${value}%` }}
            />
          ))}
          {[68, 63, 72, 54, 48, 57, 43, 35].map((value, index) => (
            <i
              className="trend-point tense"
              key={`tense-${index}`}
              style={{ left: `${4 + index * 13.1}%`, bottom: `${value}%` }}
            />
          ))}
        </div>
        <div className="trend-axis">
          {["6/8", "6/15", "6/22", "6/29", "7/6", "7/13", "7/20", "本周"].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <p className="trend-insight">
          最近两周，“安定与好奇”逐渐高于“紧张与迷失”。这只是对梦中情绪用词的统计，不代表心理诊断。
        </p>
      </div>
      <div className="insight-grid">
        <div className="panel-card">
          <h3>情绪出现频率</h3>
          <div className="emotion-bars">
            {[
              ["好奇", 78],
              ["平静", 62],
              ["焦虑", 48],
              ["怀念", 35],
            ].map(([label, value]) => (
              <div className="bar-row" key={label}>
                <span>{label}</span>
                <div className="bar-track">
                  <i style={{ width: `${value}%` }} />
                </div>
                <span>{value}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel-card">
          <h3>反复出现的梦象</h3>
          <div className="symbol-cloud">
            {["房间 ×3", "月亮 ×3", "水域 ×2", "道路 ×2", "童年 ×2", "钥匙 ×2"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SettingsView({ notify }: { notify: (message: string) => void }) {
  return (
    <section className="page">
      <div className="page-title">
        <div className="eyebrow">掌控你的私人内容</div>
        <h1>设置</h1>
        <p>你的梦默认不公开，也不会成为模型训练材料。</p>
      </div>
      <div className="settings-grid">
        <div className="settings-card">
          <h3>隐私与安全</h3>
          <p>梦境正文与报告加密保存。AI 分析时会临时解密并发送给百炼处理，服务商可能依法保存调用数据。</p>
          <div className="toggle-row">
            <span>内容日志保护</span>
            <span className="toggle" />
          </div>
          <div className="toggle-row">
            <span>转写后删除录音</span>
            <span className="toggle" />
          </div>
        </div>
        <div className="settings-card">
          <h3>费用控制</h3>
          <p>图片、视频和长篇创作生成前都会显示预估费用，避免意外重复生成。</p>
          <div className="toggle-row">
            <span>每日上限</span>
            <b>¥ 10.00</b>
          </div>
          <button className="text-button" onClick={() => notify("费用上限设置已保存")}>
            修改上限 →
          </button>
        </div>
        <div className="settings-card">
          <h3>导出全部数据</h3>
          <p>下载包含原始梦境、报告版本与创作项目的 Markdown / JSON 文件。</p>
          <button className="chip" onClick={() => notify("导出任务已创建")}>
            创建加密导出
          </button>
        </div>
        <div className="settings-card">
          <h3>回收站</h3>
          <p>删除的梦将加密保留 7 天。你也可以选择立即永久删除梦境及其全部创作媒体。</p>
          <button className="chip">查看回收站</button>
        </div>
      </div>
    </section>
  );
}

function DreamDetail({
  dream,
  tab,
  setTab,
  reportTab,
  setReportTab,
  creativeMode,
  setCreativeMode,
  goBack,
  notify,
}: {
  dream: Dream;
  tab: DetailTab;
  setTab: (tab: DetailTab) => void;
  reportTab: ReportTab;
  setReportTab: (tab: ReportTab) => void;
  creativeMode: CreativeMode;
  setCreativeMode: (mode: CreativeMode) => void;
  goBack: () => void;
  notify: (message: string) => void;
}) {
  const [analysisReady, setAnalysisReady] = useState(dream.analysisStatus !== "none");

  useEffect(() => {
    setAnalysisReady(dream.analysisStatus !== "none");
  }, [dream.id, dream.analysisStatus]);

  return (
    <section className="detail-shell">
      <button className="back-button" onClick={goBack}>
        ← 返回梦册
      </button>
      <div className="detail-heading">
        <div>
          <div className="eyebrow">{dream.date}</div>
          <h1>{dream.title}</h1>
          <p>
            {dream.emotion} · 梦境强度 {dream.intensity}/10 ·{" "}
            {analysisReady ? "报告版本 1" : "尚未深度分析"}
          </p>
        </div>
        <div className="chip-row">
          {dream.tags.slice(0, 3).map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="detail-tabs">
        <button className={tab === "analysis" ? "active" : ""} onClick={() => setTab("analysis")}>
          双轨解读
        </button>
        <button className={tab === "creative" ? "active" : ""} onClick={() => setTab("creative")}>
          ✦ 梦境创作
        </button>
        <button className={tab === "original" ? "active" : ""} onClick={() => setTab("original")}>
          原始记录
        </button>
      </div>

      {tab === "analysis" && analysisReady && (
        <AnalysisReport tab={reportTab} setTab={setReportTab} notify={notify} />
      )}
      {tab === "analysis" && !analysisReady && (
        <div className="analysis-start-card">
          <div className="analysis-start-mark">◎</div>
          <div>
            <div className="report-label">已保存 · 尚未分析</div>
            <h2>准备好以后，再认真看看这个梦</h2>
            <p>
              深度分析会读取完整梦境与已填写的现实背景，生成心理探索、传统梦象和综合启示。记录片段本身不会自动触发分析。
            </p>
            <ul>
              <li>先区分梦中事实、个人联想与理论假设</li>
              <li>传统引文标注来源，类比推演单独显示</li>
              <li>分析会生成新版本，不修改原始梦境</li>
            </ul>
            <button
              className="primary-button"
              onClick={() => {
                setAnalysisReady(true);
                notify("深度分析已经开始；完成后会保存为报告版本 1");
              }}
            >
              开始深度分析梦境
            </button>
          </div>
        </div>
      )}
      {tab === "creative" && (
        <CreativeStudio mode={creativeMode} setMode={setCreativeMode} notify={notify} />
      )}
      {tab === "original" && (
        <div className="original-card">
          <div className="report-label">原始梦境 · 不受艺术改编影响</div>
          <p>{dream.content}</p>
          <div className="chip-row">
            <span className="chip">醒来情绪：{dream.emotion}</span>
            <span className="chip">近期状态：正在做决定</span>
            <span className="chip">睡眠质量：一般</span>
          </div>
        </div>
      )}
    </section>
  );
}

function AnalysisReport({
  tab,
  setTab,
  notify,
}: {
  tab: ReportTab;
  setTab: (tab: ReportTab) => void;
  notify: (message: string) => void;
}) {
  return (
    <div className="report-layout">
      <aside className="report-nav">
        <button className={tab === "psychology" ? "active" : ""} onClick={() => setTab("psychology")}>
          心理探索
        </button>
        <button className={tab === "traditional" ? "active" : ""} onClick={() => setTab("traditional")}>
          传统梦象
        </button>
        <button className={tab === "synthesis" ? "active" : ""} onClick={() => setTab("synthesis")}>
          综合启示
        </button>
      </aside>
      <article className="report-card">
        {tab === "psychology" && (
          <>
            <div className="report-label">整合式心理探索 · 非医学诊断</div>
            <h2>一次向内靠近的邀请</h2>
            <div className="report-summary">
              <b>核心理解</b>
              <p>
                这个梦不像在催促你立刻解决问题，更像是在试探：你是否已经准备好重新靠近一段被搁置的经验。桥、童年自我、钥匙与向下的楼梯共同构成了“连接—相遇—开启—深入”的叙事。
              </p>
            </div>
            <section className="analysis-section">
              <h3>梦的情绪与叙事结构</h3>
              <div className="narrative-steps">
                <div><span>01</span><b>进入</b><p>走上没有尽头的长桥，现实规则开始松动。</p></div>
                <div><span>02</span><b>相遇</b><p>童年的自己出现，却没有直接说话。</p></div>
                <div><span>03</span><b>指引</b><p>生锈的钥匙与手势把注意力引向桥下。</p></div>
                <div><span>04</span><b>深入</b><p>你主动沿楼梯下降，梦停在探索开始的位置。</p></div>
              </div>
              <p>
                你醒来时的主情绪是“好奇”，强度为 8/10。高强度与低恐惧并存，可能意味着这段内容很重要，但你并非完全被它淹没。
              </p>
            </section>
            <section className="analysis-section">
              <h3>关键意象与个人联想</h3>
              <div className="symbol-table">
                <div className="symbol-row symbol-head"><span>意象</span><span>梦中依据</span><span>可探索的假设</span></div>
                <div className="symbol-row"><b>长桥</b><span>看不到起点与终点</span><span>可能对应一个尚未完成的过渡期</span></div>
                <div className="symbol-row"><b>童年自我</b><span>拿着钥匙、沉默等待</span><span>某种早期需要或能力正在等待被认领</span></div>
                <div className="symbol-row"><b>生锈钥匙</b><span>仍可握住，但久未使用</span><span>过去拥有、现在较少调用的资源或表达方式</span></div>
                <div className="symbol-row"><b>森林旧宅</b><span>被云层遮住、逐渐显露</span><span>与家庭、旧关系或私人记忆有关的内部空间</span></div>
              </div>
              <div className="evidence">
                原文证据：“小时候的自己拿着生锈的钥匙”“云层裂开，露出一座被森林吞没的老房子”“沿旋转楼梯向下走”。
              </div>
            </section>
            <div className="theory-grid">
              <div className="theory">
                <b>荣格视角 · 假设</b>
                <p>童年自我可以被看作尚未充分表达的人格部分；向下移动常被理解为接近较深层心理材料，但这需要你的个人联想来验证。</p>
              </div>
              <div className="theory">
                <b>精神分析视角 · 假设</b>
                <p>旧宅可能承载早期经验，钥匙“生锈”暗示某种愿望或冲突曾被搁置。它不等于压抑创伤，也不能据此做诊断。</p>
              </div>
            </div>
            <section className="analysis-section">
              <h3>联系现实背景</h3>
              <p>
                你记录了“正在做决定”。如果这个决定涉及离开熟悉环境、重新联系某个人，或开始一种曾经很想做的生活方式，梦里的“桥”就可能与它形成个人层面的呼应。这里的联系仍需由你确认。
              </p>
              <div className="reflection-grid">
                <div><b>可以追问自己</b><p>最近哪个选择让你想起小时候面对变化时的感受？</p></div>
                <div><b>身体线索</b><p>想到桥、钥匙和旧宅时，身体哪里最先出现紧张或放松？</p></div>
                <div><b>反向联想</b><p>如果那把钥匙无法开门，你会感到失望、轻松，还是安全？</p></div>
                <div><b>温和行动</b><p>写一封不必寄出的短信给童年的自己，只描述此刻的生活。</p></div>
              </div>
            </section>
            <div className="confidence-note">
              <b>分析边界</b>
              <span>较高依据：叙事结构与记录情绪 · 中等依据：现实决定的关联 · 低依据：理论流派解释</span>
            </div>
          </>
        )}
        {tab === "traditional" && (
          <>
            <div className="report-label">中国传统梦象 · 文化参考</div>
            <h2>桥为通达，月为阴明</h2>
            <div className="report-summary">
              <b>传统语境下的整体倾向</b>
              <p>
                桥与钥匙都包含“由闭至开、由此达彼”的意味；月、云与旧宅则使这种变化更偏向旧事、家宅与内在情绪。以下只呈现文化体系中的可能倾向，不构成预测。
              </p>
            </div>
            <section className="analysis-section">
              <h3>古籍直接匹配</h3>
              <p className="section-note">直接匹配只采用能定位版本与篇目的条目；无法核验的网络签文不会被引用。</p>
            </section>
            <div className="source-card">
              <small>桥梁 · 直接匹配</small>
              <blockquote>“梦桥梁者，主通达。”在传统梦书的解释框架中，桥常与往来、过渡和阻隔的消解相关。</blockquote>
              <a href="https://ctext.org/library.pl?if=gb&remap=gb&res=3577" target="_blank" rel="noreferrer">
                《梦林玄解》馆藏版本 ↗
              </a>
            </div>
            <div className="source-card">
              <small>屋宅 · 直接匹配范围</small>
              <blockquote>古代梦书常依房屋的新旧、明暗、开闭与进入方式分别判断。你的梦是“远见旧宅、尚未入门”，因此不能直接套用“入宅”类条目。</blockquote>
              <span className="source-status">匹配强度：中 · 仍需结合具体版本复核</span>
            </div>
            <section className="analysis-section">
              <h3>AI 类比推演</h3>
              <div className="analogy-list">
                <div><b>月近如灯</b><p>可类比为“幽处得明”，但“旧灯”是你的梦中独特表达，并非古籍原句。</p></div>
                <div><b>生锈钥匙</b><p>“钥匙”缺少稳定的古籍直接条目，因此只类比为闭处将启、旧事重开的可能象征。</p></div>
                <div><b>童年自我</b><p>属于现代心理叙事中的人物形态，不应伪装成古代梦占概念。</p></div>
              </div>
            </section>
            <div className="confidence-note">
              <b>文化解释边界</b>
              <span>直接匹配：桥梁 · 类比推演：月、钥匙、旧宅组合 · 不作吉凶断言，也不提供行动预警</span>
            </div>
          </>
        )}
        {tab === "synthesis" && (
          <>
            <div className="report-label">双轨综合 · 保留不确定性</div>
            <h2>共同指向：过渡与重新开启</h2>
            <div className="report-summary">
              <b>一句话综合</b>
              <p>
                两条解释路径都看见了“从旧状态进入新状态”的主题，但心理探索关注你的个人经验，传统梦象提供的是文化象征，两者不能互相证明。
              </p>
            </div>
            <section className="analysis-section">
              <h3>双轨对照</h3>
              <div className="comparison-grid">
                <div className="comparison-head"><span>观察点</span><span>心理探索</span><span>传统梦象</span></div>
                <div><b>桥</b><span>尚未完成的现实过渡</span><span>通达、往来与阻隔消解</span></div>
                <div><b>钥匙</b><span>曾经拥有但久未调用的心理资源</span><span>缺少直接条目，只能类比“开启”</span></div>
                <div><b>旧宅</b><span>家庭、旧关系或私人记忆</span><span>需按新旧、开闭、是否进入细分</span></div>
                <div><b>共同主题</b><span>靠近被搁置的内容</span><span>由闭至开、由此达彼</span></div>
              </div>
            </section>
            <section className="analysis-section">
              <h3>哪里仍然不确定</h3>
              <ul className="uncertainty-list">
                <li>“旧宅”是否与真实家庭经验有关，目前没有你的个人联想支持。</li>
                <li>童年自我可能代表年龄记忆，也可能只是梦为了表达“过去”而创造的形象。</li>
                <li>传统梦象只能作为文化阅读，不能预测这个决定的结果。</li>
              </ul>
            </section>
            <section className="analysis-section">
              <h3>未来一周的观察建议</h3>
              <div className="action-list">
                <div><span>1</span><p><b>遇到犹豫时</b>，先记录身体最明显的感觉，不急着做梦象对照。</p></div>
                <div><span>2</span><p><b>补充个人联想</b>：现实中哪座桥、哪间房最先浮现？它们会显著改变报告方向。</p></div>
                <div><span>3</span><p><b>若梦再次出现</b>，比较钥匙、房门和童年自我的变化，而不是只判断吉凶。</p></div>
              </div>
            </section>
            <div className="evidence">
              当前综合可信度：中等。依据来自梦境原文、醒来情绪和“正在做决定”的背景；艺术改编内容未被读取。
            </div>
          </>
        )}
        <button className="primary-button" onClick={() => notify("追问对话已开启；回答后会生成报告版本 2")}>
          围绕这个梦继续追问
        </button>
      </article>
    </div>
  );
}

function CreativeStudio({
  mode,
  setMode,
  notify,
}: {
  mode: CreativeMode;
  setMode: (mode: CreativeMode) => void;
  notify: (message: string) => void;
}) {
  return (
    <>
      <div className="creative-toolbar">
        <div>
          <h2>把梦变成另一种作品</h2>
          <p>艺术延展独立保存，永远不会进入心理与梦象分析。</p>
        </div>
        <div className="creative-switch">
          <button className={mode === "image" ? "active" : ""} onClick={() => setMode("image")}>
            生成画面
          </button>
          <button className={mode === "novel" ? "active" : ""} onClick={() => setMode("novel")}>
            小说改编
          </button>
          <button className={mode === "film" ? "active" : ""} onClick={() => setMode("film")}>
            电影化
          </button>
        </div>
      </div>
      {mode === "image" && <ImageStudio notify={notify} />}
      {mode === "novel" && <NovelStudio notify={notify} />}
      {mode === "film" && <FilmStudio notify={notify} />}
    </>
  );
}

function ImageStudio({ notify }: { notify: (message: string) => void }) {
  const [selected, setSelected] = useState(0);
  const [adaptation, setAdaptation] = useState("合理补全");
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const generate = () => {
    setGenerating(true);
    setDone(false);
    window.setTimeout(() => {
      setGenerating(false);
      setDone(true);
      notify("画面草图已生成，并标记为 AI 艺术延展");
    }, 1800);
  };
  const scenes = [
    ["月下长桥", "云海上没有尽头的石桥", "art-bridge"],
    ["森林旧宅", "云层裂开，房子若隐若现", "art-forest"],
    ["旋转楼梯", "向记忆更深处缓慢下降", "art-stairs"],
  ];
  return (
    <div className="studio">
      <div className="studio-main">
        <div className="studio-title">
          <h3>选择梦中的一幕</h3>
          <button className="text-button">＋ 框选原文 / 自定义</button>
        </div>
        <div className="scene-grid">
          {scenes.map((scene, index) => (
            <button
              className={`scene-card ${selected === index ? "selected" : ""}`}
              key={scene[0]}
              onClick={() => setSelected(index)}
            >
              <figure>
                <div className={`scene-art ${scene[2]}`} />
                <figcaption>
                  <b>{scene[0]}</b>
                  <small>{scene[1]}</small>
                </figcaption>
              </figure>
            </button>
          ))}
        </div>
        <div className="control-group">
          <label>改编幅度</label>
          <div className="segmented">
            {["忠于梦境", "合理补全", "自由改编"].map((item) => (
              <button className={adaptation === item ? "active" : ""} key={item} onClick={() => setAdaptation(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="control-group">
          <label>视觉风格</label>
          <select className="style-select" aria-label="视觉风格">
            <option>梦幻电影感 · 柔和月光与胶片颗粒</option>
            <option>超现实主义 · 不合逻辑的空间</option>
            <option>国风水墨 · 留白与淡彩</option>
            <option>写实摄影 · 自然光</option>
            <option>动画电影 · 手绘质感</option>
          </select>
        </div>
        <div className="control-group">
          <label>画面比例</label>
          <div className="chip-row">
            <button className="chip selected">16:9 电影</button>
            <button className="chip">9:16 手机</button>
            <button className="chip">1:1 方形</button>
          </div>
        </div>
        <div className="cost-line">
          <span>草图模型：wan2.7-image</span>
          <span>预估 ¥0.20 · 1 张</span>
        </div>
        <button className="primary-button" onClick={generate} disabled={generating}>
          {generating ? "正在梦境中显影…" : "确认并生成画面"}
        </button>
        {generating && (
          <div className="generation">
            <small>正在提炼场景、人物和月光氛围</small>
            <div className="generation-bar">
              <i />
            </div>
          </div>
        )}
        {done && <div className={`output-art ${scenes[selected][2]}`} />}
      </div>
      <aside className="studio-aside">
        <h3>创作圣经</h3>
        <div className="bible-item">
          <small>核心人物</small>
          <p>“我”与 8 岁左右的童年自我；视觉形象默认去识别化。</p>
        </div>
        <div className="bible-item">
          <small>世界规则</small>
          <p>云层如海，空间可向记忆内部折叠；月亮始终像一盏旧灯。</p>
        </div>
        <div className="bible-item">
          <small>固定意象</small>
          <p>生锈钥匙、长桥、森林旧宅、向下旋转的楼梯。</p>
        </div>
        <div className="bible-item">
          <small>色彩与质感</small>
          <p>灰绿、旧金与月白；安静、潮湿、带轻微胶片颗粒。</p>
        </div>
        <button className="text-button" onClick={() => notify("创作圣经已打开，可逐项编辑")}>
          编辑全部设定 →
        </button>
      </aside>
    </div>
  );
}

function NovelStudio({ notify }: { notify: (message: string) => void }) {
  return (
    <div className="novel-layout">
      <aside className="chapter-list">
        <button className="chapter-item active">00 · 故事梗概 ✓</button>
        <button className="chapter-item">01 · 桥上来客</button>
        <button className="chapter-item">02 · 云层之下</button>
        <button className="chapter-item">03 · 生锈的钥匙</button>
        <button className="chapter-item">04 · 老房子的门</button>
      </aside>
      <article className="novel-editor">
        <div className="report-label">奇幻心理短篇 · 合理补全</div>
        <h2>《云层下的钥匙》</h2>
        <p>
          每到月亮最低的夜晚，城里都会出现一座桥。没人知道桥从哪里开始，也没人真的走到过尽头。林遥第一次看见它，是在收到老房子拆迁通知的那天。
        </p>
        <p>
          桥下没有河。云像沉默的潮水，在石拱之间缓慢流动。她走到中央时，一个女孩正靠着栏杆等她——八岁，短发，左膝有一道熟悉的疤。
        </p>
        <div className="evidence">AI 艺术延展：人物姓名、拆迁通知与城市设定并非原始梦境内容。</div>
        <div className="chip-row">
          <button className="chip" onClick={() => notify("正在读取创作圣经与锁定章节")}>
            生成第一章
          </button>
          <button className="chip">重写语气</button>
          <button className="chip">导出 Markdown / EPUB</button>
        </div>
      </article>
    </div>
  );
}

function FilmStudio({ notify }: { notify: (message: string) => void }) {
  const shots = [
    ["远景 · 桥出现", "art-bridge"],
    ["中景 · 与童年相遇", "art-stairs"],
    ["俯拍 · 云层裂开", "art-forest"],
    ["推进 · 走入旧宅", "art-stairs"],
  ];
  return (
    <>
      <div className="film-logline">
        <small>电影梗概 · 奇幻 / 心理 / 12 分钟</small>
        <h2>一位正在告别旧居的女性走上一座云海之桥，必须从童年的自己手中接过钥匙，才能回到醒着的世界。</h2>
      </div>
      <div className="studio-main">
        <div className="studio-title">
          <h3>第一幕 · 分镜预览</h3>
          <button className="text-button">查看完整剧本 →</button>
        </div>
        <div className="shots">
          {shots.map((shot, index) => (
            <figure className="shot" key={shot[0]}>
              <div className={`shot-art ${shot[1]}`} />
              <figcaption>
                {String(index + 1).padStart(2, "0")}　{shot[0]}
                <br />6 秒 · 低声环境音
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="cost-line">
          <span>wan2.7-i2v · 720P · 6 秒</span>
          <span>使用角色设定图保持连续性</span>
        </div>
        <button className="primary-button" onClick={() => notify("选中分镜已进入私密视频生成队列")}>
          选择分镜并生成视频镜头
        </button>
      </div>
    </>
  );
}
