"use client";

import { useState, useRef, useEffect } from "react";
import { useApi } from "@/hooks/useApi";
import { Trash2, Plus, Sparkles, Wand2, FileText, User, Upload, Swords } from "lucide-react";
import { VoiceSelection } from "@/types";

interface DialogueLine {
    id: string;
    speaker: "Host" | "Guest";
    text: string;
}

interface ScriptEditorProps {
    onScriptChange: (script: DialogueLine[]) => void;
}

const styles = [
    {
        id: "Deep Dive",
        icon: <Wand2 className="w-4 h-4 text-indigo-500" />,
        desc: "Lively conversation unpacking & connecting topics.",
        color: "indigo"
    },
    {
        id: "Debate",
        icon: <Swords className="w-4 h-4 text-red-500" />,
        desc: "Thoughtful debate on different perspectives.",
        color: "red"
    },
    {
        id: "Critique",
        icon: <FileText className="w-4 h-4 text-purple-500" />,
        desc: "Expert review offering constructive feedback.",
        color: "purple"
    }
];

export default function ScriptEditor({ onScriptChange }: ScriptEditorProps) {
    const api = useApi();
    const [activeTab, setActiveTab] = useState<"manual" | "ai">("ai");
    const [lines, setLines] = useState<DialogueLine[]>([
        { id: "1", speaker: "Host", text: "" }
    ]);

    // AI State
    const [topic, setTopic] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isUploadMode, setIsUploadMode] = useState(false);
    const [style, setStyle] = useState("Deep Dive");
    const [language, setLanguage] = useState("Chinese");
    const [rounds, setRounds] = useState(5);
    const [generating, setGenerating] = useState(false);
    const [optimizing, setOptimizing] = useState(false);

    // Auto-pass changes to parent
    useEffect(() => {
        onScriptChange(lines);
    }, [lines, onScriptChange]);

    const addLine = (speaker: "Host" | "Guest" = "Host") => {
        setLines([...lines, { id: Math.random().toString(36).substring(2, 9), speaker, text: "" }]);
    };

    const removeLine = (id: string) => {
        setLines(lines.filter(l => l.id !== id));
    };

    const updateLine = (id: string, field: keyof DialogueLine, value: any) => {
        setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const handleOptimize = async () => {
        if (lines.length === 0 || !lines.some(l => l.text.trim())) {
            alert("Script is empty. Please generate or write a script first.");
            return;
        }

        setOptimizing(true);
        try {
            const data = await api.post("/api/optimize-script", { script: lines });
            if (data.success && data.script) {
                // Merge optimized text back into lines, preserving IDs if possible
                // The backend tries to keep structure.
                setLines(data.script);
            }
        } catch (e) {
            console.error("Optimization failed", e);
            alert("Failed to optimize script emotions.");
        } finally {
            setOptimizing(false);
        }
    };

    const handleAiGenerate = async () => {
        if (!topic && !file) {
            alert("Please provide text or a file.");
            return;
        }

        setGenerating(true);
        const formData = new FormData();
        if (topic) formData.append("text", topic);
        if (file) formData.append("file", file);
        formData.append("host_name", "Host");
        formData.append("guest_name", "Guest");
        formData.append("mode", "multi");
        formData.append("style", style);
        formData.append("language", language);
        formData.append("n_rounds", rounds.toString());

        try {
            const data = await api.postFormData("/api/generate/script", formData);
            if (data.script && Array.isArray(data.script)) {
                const newLines: DialogueLine[] = data.script.map((item: any) => ({
                    id: Math.random().toString(36).substring(2, 9),
                    speaker: item.speaker === "Guest" ? "Guest" : "Host",
                    text: item.text
                }));
                setLines(newLines);
                setActiveTab("manual");
            }
        } catch (e) {
            console.error("Script generation failed", e);
            alert("Failed to generate script.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setActiveTab("ai")}
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === "ai" ? "bg-amber-50/50 text-amber-900 border-b-2 border-amber-900" : "text-gray-500 hover:bg-gray-50"}`}
                >
                    <Sparkles className="w-4 h-4" /> AI Generator
                </button>
                <button
                    onClick={() => setActiveTab("manual")}
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === "manual" ? "bg-amber-50/50 text-amber-900 border-b-2 border-amber-900" : "text-gray-500 hover:bg-gray-50"}`}
                >
                    <FileText className="w-4 h-4" /> Manual Editor
                </button>
            </div>

            <div className="p-6">
                {activeTab === "ai" ? (
                    <div className="space-y-8">
                        {/* Content Source Selection */}
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="flex border-b border-gray-100 bg-gray-50/50">
                                <button
                                    onClick={() => { setIsUploadMode(false); setFile(null); }}
                                    className={`flex-1 py-3 text-sm font-medium transition-colors ${!isUploadMode ? "bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    Paste Text
                                </button>
                                <button
                                    onClick={() => { setIsUploadMode(true); setTopic(""); }}
                                    className={`flex-1 py-3 text-sm font-medium transition-colors ${isUploadMode ? "bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    Upload File
                                </button>
                            </div>

                            <div className="p-4 bg-white min-h-[160px]">
                                {!isUploadMode ? (
                                    <textarea
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="Paste article content, notes, or describe the topic here..."
                                        className="w-full h-32 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none text-sm leading-relaxed"
                                    />
                                ) : (
                                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-blue-50/30 hover:border-blue-300 transition-all group relative">

                                        {file ? (
                                            <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
                                                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                                                    {file.name.endsWith('.pdf') ? <div className="text-red-500 font-bold text-xs uppercase border border-red-100 bg-red-50 px-1.5 py-0.5 rounded">PDF</div> :
                                                        file.name.endsWith('.docx') ? <div className="text-blue-500 font-bold text-xs uppercase border border-blue-100 bg-blue-50 px-1.5 py-0.5 rounded">DOCX</div> :
                                                            <FileText className="w-6 h-6 text-gray-400" />}
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-sm font-bold text-gray-800 truncate max-w-[200px]">{file.name}</div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                        className="text-xs text-red-500 hover:text-red-600 font-medium mt-1 underline decoration-red-200 hover:decoration-red-500 underline-offset-2 transition-all"
                                                    >
                                                        Remove File
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-gray-300 group-hover:text-blue-400 transition-colors mb-2" />
                                                <div className="text-sm font-medium text-gray-500">Click to upload document for analysis</div>
                                                <div className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT</div>
                                            </>
                                        )}

                                        <input
                                            type="file"
                                            accept=".pdf,.docx,.txt"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const selected = e.target.files?.[0];
                                                if (selected) {
                                                    setFile(selected);
                                                    setTopic(""); // Clear text when file is selected
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Language Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-3">Target Language</label>
                            <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                                <button
                                    onClick={() => setLanguage("Chinese")}
                                    className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${language === "Chinese" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <span>🇨🇳</span> Chinese
                                </button>
                                <button
                                    onClick={() => setLanguage("English")}
                                    className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${language === "English" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <span>🇺🇸</span> English
                                </button>
                                <button
                                    onClick={() => setLanguage("French")}
                                    className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${language === "French" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <span>🇫🇷</span> French
                                </button>
                                <button
                                    onClick={() => setLanguage("German")}
                                    className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${language === "German" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <span>🇩🇪</span> German
                                </button>
                                <button
                                    onClick={() => setLanguage("Japanese")}
                                    className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${language === "Japanese" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <span>🇯🇵</span> Japanese
                                </button>
                                <button
                                    onClick={() => setLanguage("Korean")}
                                    className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${language === "Korean" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <span>🇰🇷</span> Korean
                                </button>
                                <button
                                    onClick={() => setLanguage("Russian")}
                                    className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${language === "Russian" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <span>🇷🇺</span> Russian
                                </button>
                            </div>
                        </div>

                        {/* Dialogue Turns */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-sm font-medium text-gray-600">Dialogue Turns</label>
                                <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{rounds}</span>
                            </div>
                            <input
                                type="range"
                                min="2"
                                max="15"
                                value={rounds}
                                onChange={(e) => setRounds(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        {/* Analysis Style */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-4">Analysis Style</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {styles.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setStyle(s.id)}
                                        className={`text-left p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 group ${style === s.id
                                            ? "border-blue-600 bg-blue-50/50 shadow-sm"
                                            : "border-gray-100 bg-gray-50/30 hover:border-gray-200"}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                                            {s.icon}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-slate-800">{s.id}</div>
                                            <div className="text-[11px] leading-relaxed text-slate-500 mt-1">{s.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleAiGenerate}
                            disabled={generating}
                            className="w-full py-4 bg-gradient-to-r from-slate-800 to-slate-950 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden group relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            {generating ? <Sparkles className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                            {generating ? "Crafting Your Script..." : "Generate Magic Script"}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Manual Editor Toolbar */}
                        <div className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100 mb-4">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Script Content
                            </div>
                            <button
                                onClick={handleOptimize}
                                disabled={optimizing || lines.length === 0}
                                className="px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {optimizing ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {optimizing ? "Polishing..." : "Auto Emotion Polish"}
                            </button>
                        </div>

                        {lines.map((line, index) => (
                            <div key={line.id} className="flex gap-4 group">
                                <div className="pt-2">
                                    <button
                                        onClick={() => updateLine(line.id, "speaker", line.speaker === "Host" ? "Guest" : "Host")}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${line.speaker === "Host" ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-cyan-100 text-cyan-800 border-cyan-200"} border-2`}
                                        title={`Current: ${line.speaker}. Click to switch.`}
                                    >
                                        <span className="font-bold text-xs">{line.speaker[0]}</span>
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        value={line.text}
                                        onChange={(e) => {
                                            updateLine(line.id, "text", e.target.value);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        ref={(el) => {
                                            if (el) {
                                                el.style.height = 'auto';
                                                el.style.height = el.scrollHeight + 'px';
                                            }
                                        }}
                                        placeholder={`${line.speaker} says...`}
                                        className="w-full p-4 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none shadow-sm text-slate-700 leading-relaxed"
                                    />
                                </div>
                                <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => removeLine(line.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Emotion Guide Wrapper */}
                        <div className="pt-2">
                            <details className="group bg-blue-50/30 rounded-2xl border border-blue-100/50 overflow-hidden transition-all">
                                <summary className="flex items-center justify-between p-4 cursor-pointer list-none hover:bg-blue-50/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                            <Sparkles className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-slate-800">Lyrebird Emotion Guide</span>
                                            <p className="text-[10px] text-blue-600 font-medium uppercase tracking-wider">Click to see how to add emotions</p>
                                        </div>
                                    </div>
                                    <Plus className="w-4 h-4 text-blue-400 group-open:rotate-45 transition-transform" />
                                </summary>
                                <div className="p-4 pt-0 border-t border-blue-100/30 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-3">
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            You can control the emotion of each sentence by adding an <strong>Instruct Prefix</strong> at the very beginning of your text.
                                        </p>
                                        <div className="bg-white rounded-xl p-3 border border-blue-100 shadow-sm space-y-2">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Example:</div>
                                            <code className="block text-xs text-blue-700 font-mono bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                                                你说话的情感是happy。欢迎使用阿里百炼语音合成服务！
                                            </code>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {["neutral", "happy", "sad", "angry", "fearful", "surprised", "disgusted"].map(emo => (
                                                <span key={emo} className="px-2 py-1 rounded-md bg-white border border-gray-100 text-[10px] font-bold text-slate-500 uppercase tracking-tight">{emo}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </details>
                        </div>

                        <div className="flex gap-4 items-center justify-center pt-4 border-t border-dashed border-gray-200">
                            <button onClick={() => addLine("Host")} className="flex items-center gap-2 px-4 py-2 rounded-full border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 text-sm font-medium">
                                <Plus className="w-4 h-4" /> Add Host Line
                            </button>
                            <button onClick={() => addLine("Guest")} className="flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-200 text-cyan-800 bg-cyan-50 hover:bg-cyan-100 text-sm font-medium">
                                <Plus className="w-4 h-4" /> Add Guest Line
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
