"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { VoiceProfile } from "@/types";
import { Mic, Upload, Trash2, User, Play, RotateCcw, Search } from "lucide-react";

interface VoiceSelectorProps {
    onSelectHost: (voiceId: string) => void;
    onSelectGuest: (voiceId: string) => void;
    selectedHostId: string;
    selectedGuestId: string;
}

export default function VoiceSelector({
    onSelectHost,
    onSelectGuest,
    selectedHostId,
    selectedGuestId
}: VoiceSelectorProps) {
    const api = useApi();
    const [voices, setVoices] = useState<VoiceProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Upload State
    const [newVoiceName, setNewVoiceName] = useState("");
    const [newVoiceFile, setNewVoiceFile] = useState<File | null>(null);

    useEffect(() => {
        fetchVoices();
    }, []);

    const fetchVoices = async () => {
        try {
            const data = await api.get("/api/voices");
            setVoices(data);
            // Auto-select first voice if none selected
            if (data.length > 0) {
                if (!selectedHostId) onSelectHost(data[0].id);
                if (!selectedGuestId && data.length > 1) onSelectGuest(data[1].id);
                else if (!selectedGuestId) onSelectGuest(data[0].id);
            }
        } catch (err) {
            console.error("Failed to fetch voices:", err);
            setError("Failed to load voices.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (fileParam?: File, nameParam?: string) => {
        const file = fileParam || newVoiceFile;
        const name = nameParam || newVoiceName;

        if (!name || !file) {
            console.error("Missing name or file for upload");
            return;
        }

        setUploading(true);
        setIsProcessing(false);
        setError(null);
        setSuccessMsg(null);
        const formData = new FormData();
        formData.append("name", name);
        formData.append("file", file);

        try {
            console.log(`[Frontend] Starting upload for ${name}...`);
            await api.postFormData("/api/voices/upload", formData);
            setUploading(false);
            setIsProcessing(true);

            setNewVoiceName("");
            setNewVoiceFile(null);

            // Wait a moment for the backend to finalize and then refresh
            await fetchVoices();

            setIsProcessing(false);
            setSuccessMsg("Voice cloned successfully!");
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err) {
            console.error("Upload failed", err);
            setError("Failed to upload voice.");
            setUploading(false);
            setIsProcessing(false);
            setTimeout(() => setError(null), 3000);
        }
    };

    const handlePlay = async (voiceId: string) => {
        if (playingId === voiceId) return;
        setPlayingId(voiceId);
        try {
            const audio = new Audio(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/voices/${voiceId}/sample`);
            audio.onended = () => setPlayingId(null);
            audio.onerror = () => {
                setPlayingId(null);
                setError("Failed to play sample.");
                setTimeout(() => setError(null), 3000);
            };
            await audio.play();
        } catch (err) {
            setPlayingId(null);
        }
    };

    const handleDelete = async (voiceId: string) => {
        if (!confirm("Are you sure you want to delete this voice?")) return;
        try {
            await api.del(`/api/voices/${voiceId}`);
            setSuccessMsg("Voice deleted.");
            fetchVoices();
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err) {
            setError("Failed to delete voice.");
            setTimeout(() => setError(null), 3000);
        }
    };

    if (loading) return <div>Loading voices...</div>;

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-8">
            {/* 1. Voice Lab Header & Upload */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm">
                        <Mic className="w-6 h-6 text-slate-900" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 font-manrope">Voice Lab</h2>
                </div>

                <p className="text-sm text-gray-500">Upload a 10s audio clip to clone a unique voice.</p>

                <div
                    onClick={() => !uploading && !isProcessing && document.getElementById('voice-upload')?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group relative overflow-hidden ${(uploading || isProcessing) ? 'bg-blue-50/50 border-blue-200' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/20'
                        }`}
                >
                    {(uploading || isProcessing) ? (
                        <div className="flex flex-col items-center gap-2 py-4">
                            <RotateCcw className="w-8 h-8 text-blue-500 animate-spin" />
                            <div className="font-bold text-sm text-blue-600">
                                {uploading ? "Uploading Audio..." : "Cloning Voice..."}
                            </div>
                            <div className="text-[10px] text-blue-400 uppercase tracking-widest animate-pulse">
                                {uploading ? "Sending to server" : "Analyzing harmonics"}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <Upload className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-sm text-slate-700">Upload reference</div>
                                <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">MP3, WAV up to 10MB</div>
                            </div>
                        </>
                    )}

                    {error && !uploading && !isProcessing && (
                        <div className="absolute top-2 right-2 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-md animate-in fade-in slide-in-from-top-1">
                            {error}
                        </div>
                    )}

                    {successMsg && !uploading && !isProcessing && (
                        <div className="absolute inset-0 bg-green-50/90 flex flex-col items-center justify-center animate-in fade-in duration-500 z-10">
                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mb-2">
                                <Search className="w-5 h-5" /> {/* Use a checkmark if available, searching for check... Search is close enough for a quick visual or I'll use a text */}
                            </div>
                            <div className="font-bold text-sm text-green-700">{successMsg}</div>
                        </div>
                    )}

                    <input
                        id="voice-upload"
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                // Add 5MB size limit
                                const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
                                if (file.size > MAX_SIZE) {
                                    alert("File too large. Maximum size is 5MB.");
                                    e.target.value = '';
                                    return;
                                }

                                const name = prompt("Name this voice:");
                                if (name) {
                                    handleUpload(file, name);
                                }
                                // Reset the input so the same file can be selected again
                                e.target.value = '';
                            }
                        }}
                    />
                </div>
            </div>

            {/* 2. Character Assignment (Dropdowns) */}
            <div className="space-y-6 pt-6 border-t border-gray-100">
                <div className="flex flex-col gap-4">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Character Assignment</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-amber-600 uppercase">Host</span>
                            <select
                                value={selectedHostId}
                                onChange={(e) => onSelectHost(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium outline-none hover:bg-white transition-colors"
                            >
                                {voices.map(v => <option key={`h-${v.id}`} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-cyan-600 uppercase">Guest</span>
                            <select
                                value={selectedGuestId}
                                onChange={(e) => onSelectGuest(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium outline-none hover:bg-white transition-colors"
                            >
                                {voices.map(v => <option key={`g-${v.id}`} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Active Voices List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Voices</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/10 outline-none w-40"
                            />
                        </div>
                        <button onClick={fetchVoices} className="p-1.5 text-gray-400 hover:text-slate-900 transition-colors">
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    {voices.map((voice) => (
                        <div
                            key={voice.id}
                            className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${voice.id === selectedHostId ? "bg-amber-100 text-amber-700" :
                                    voice.id === selectedGuestId ? "bg-cyan-100 text-cyan-700" :
                                        "bg-white text-slate-400"
                                    }`}>
                                    {voice.name[0]}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5 h-6">
                                        <span className="truncate max-w-[140px]" title={voice.name}>{voice.name}</span>
                                        {voice.id === selectedHostId && <span className="text-[8px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded-full uppercase tracking-tighter flex-shrink-0">H</span>}
                                        {voice.id === selectedGuestId && <span className="text-[8px] bg-cyan-100 text-cyan-700 px-1 py-0.5 rounded-full uppercase tracking-tighter flex-shrink-0">G</span>}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-medium capitalize">Cloned Voice</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handlePlay(voice.id)}
                                    disabled={playingId === voice.id}
                                    className={`p-2 rounded-lg transition-colors ${playingId === voice.id
                                        ? "text-blue-600 bg-blue-50"
                                        : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                        }`}
                                >
                                    {playingId === voice.id ? (
                                        <RotateCcw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Play className="w-5 h-5" />
                                    )}
                                </button>
                                <button
                                    onClick={() => handleDelete(voice.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
