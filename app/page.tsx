import type { Metadata } from "next";
import { DreamApp } from "./DreamApp";
export const metadata: Metadata = { title: "梦屿 · 私人梦境档案", description: "真实可用的私人梦境记录、语音转写、个性化解读与长期洞察。" };
export default function Home(){ return <DreamApp/>; }
