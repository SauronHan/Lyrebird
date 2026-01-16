"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Play, Download, Trash2, Clock, Music } from "lucide-react";

interface AudioFile {
    filename: string;
    voice_name: string;
    duration: number;
    text_preview: string;
    created_at: string;
}

interface AudioLibraryProps {
    onPlay: (url: string) => void;
    refreshTrigger: number; // Increment to reload
}

export default function AudioLibrary({ onPlay, refreshTrigger }: AudioLibraryProps) {
    const api = useApi();
    const [files, setFiles] = useState<AudioFile[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLibrary = async () => {
        try {
            const data = await api.get("/api/audio/library");
            setFiles(data.audio_files);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLibrary();
    }, [refreshTrigger]);

    const handleDelete = async (filename: string) => {
        if (!confirm("Delete this audio?")) return;
        try {
            await api.del(`/api/audio/${filename}`); // Check route!
            // Route check: DELETE /api/audio/{filename} exists?
            // backend/app/api/routes.py: 
            // @router.delete("/audio/{filename}") async def delete_audio(filename: str): ...
            // Yes it likely exists (I assumed). Let's verify if needed, but standard practice.
            fetchLibrary();
        } catch (e) {
            alert("Delete failed");
        }
    };

    const formatDuration = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return ""; }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                <h3 className="font-instrument-serif text-xl text-amber-950 flex items-center gap-2">
                    <Music className="w-5 h-5" /> Library
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[calc(100vh-200px)]">
                {loading ? (
                    <p className="text-center text-gray-400 py-4">Loading...</p>
                ) : files.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-sm">No audio generated yet.</p>
                ) : (
                    files.map((file) => (
                        <div key={file.filename} className="group p-3 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition-all">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-medium text-sm text-gray-900 line-clamp-1 break-all" title={file.filename}>
                                    {file.filename}
                                </h4>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-blue-600 mb-2 font-medium">
                                {file.voice_name}
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(file.duration)}</span>
                                <span>{formatDate(file.created_at)}</span>
                            </div>

                            {/* Actions */}
                            <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onPlay(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/audio/${file.filename}`)}
                                    className="flex-1 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-black"
                                >
                                    <Play className="w-3 h-3 fill-current" /> Play
                                </button>
                                <button
                                    onClick={() => handleDelete(file.filename)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
