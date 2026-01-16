"use client";

import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Play, Settings2, Download, Save } from "lucide-react";

interface AudioGeneratorProps {
    hostId: string;
    guestId: string;
    scriptLines: { speaker: string, text: string }[];
    onAudioGenerated: (audioUrl: string, filename: string) => void;
}

export default function AudioGenerator({ hostId, guestId, scriptLines, onAudioGenerated }: AudioGeneratorProps) {
    const api = useApi();
    // const [cfgScale, setCfgScale] = useState(1.3); // Removed for Lyrebird
    const [speed, setSpeed] = useState(1.0);
    const [pitch, setPitch] = useState(1.0);
    const [generating, setGenerating] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");

    const handleGenerate = async () => {
        if (!hostId) {
            alert("Please select a Host voice.");
            return;
        }
        if (scriptLines.length === 0 || !scriptLines.some(l => l.text.trim())) {
            alert("Script is empty.");
            return;
        }

        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const filenameInput = prompt("Enter filename prefix (optional):");
        if (filenameInput === null) return;

        const now = new Date();
        const timestamp = now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0') +
            now.getSeconds().toString().padStart(2, '0');

        const finalFilename = `${today}_${filenameInput || 'podcast'}_${timestamp}.wav`;

        setGenerating(true);

        const text = scriptLines.map(line => {
            const speakerId = line.speaker === "Guest" ? 1 : 0;
            return `Speaker ${speakerId}: ${line.text}`;
        }).join("\n");

        try {
            const payload = {
                text,
                voice_id: hostId,
                guest_voice_id: guestId,
                num_speakers: scriptLines.some(l => l.speaker === "Guest") ? 2 : 1,
                speed,
                pitch,
                custom_filename: finalFilename
            };

            const taskRes = await api.post("/api/generate", payload);

            if (taskRes.task_id) {
                setStatusMsg("Task submitted, processing...");
                const taskId = taskRes.task_id;

                const pollInterval = setInterval(async () => {
                    try {
                        const statusRes = await api.get(`/api/tasks/${taskId}`);
                        if (statusRes.status === "completed") {
                            clearInterval(pollInterval);
                            setGenerating(false);
                            setStatusMsg("");

                            const result = statusRes.result;
                            if (result && result.audio_url) {
                                onAudioGenerated(result.audio_url, result.filename);
                            } else {
                                alert("Generation completed but no audio URL found.");
                            }
                        } else if (statusRes.status === "failed") {
                            clearInterval(pollInterval);
                            setGenerating(false);
                            setStatusMsg("");
                            alert(`Generation failed: ${statusRes.error}`);
                        } else {
                            setStatusMsg(`Processing... (${statusRes.status})`);
                        }
                    } catch (err) {
                        console.error("Polling error", err);
                    }
                }, 1000);

                return;
            } else {
                throw new Error("No task ID returned");
            }

        } catch (e) {
            console.error("Audio generation failed", e);
            alert("Failed to start audio generation.");
            setGenerating(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-600" /> Production Settings
            </h3>

            <div className="space-y-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                                Global Speed
                            </label>
                            <span className="text-xs font-mono font-bold text-indigo-600">{speed}x</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={speed}
                            onChange={(e) => setSpeed(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                                Global Pitch
                            </label>
                            <span className="text-xs font-mono font-bold text-indigo-600">{pitch}x</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={pitch}
                            onChange={(e) => setPitch(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-black transition-colors shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-wait"
            >
                {generating ? (
                    <>{statusMsg || "Generatng Audio..."}</>
                ) : (
                    <>
                        <Play className="w-5 h-5 fill-current" /> Produce Podcast
                    </>
                )}
            </button>
        </div>
    );
}
