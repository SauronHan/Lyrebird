"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import VoiceSelector from "@/components/studio/VoiceSelector";
import ScriptEditor from "@/components/studio/ScriptEditor";
import AudioGenerator from "@/components/studio/AudioGenerator";
import AudioLibrary from "@/components/studio/AudioLibrary";
import { X, Play, Pause, Download } from "lucide-react";

export default function StudioPage() {
    const { isLoaded, userId } = useAuth();

    // State
    const [selectedHostId, setSelectedHostId] = useState("");
    const [selectedGuestId, setSelectedGuestId] = useState("");
    const [scriptLines, setScriptLines] = useState<Array<{ speaker: string, text: string }>>([]);

    const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
    const [currentFilename, setCurrentFilename] = useState<string>("");
    const [refreshLibraryTrig, setRefreshLibraryTrig] = useState(0);

    if (isLoaded && !userId) {
        redirect("/");
    }

    const handleAudioGenerated = (url: string, filename: string) => {
        setCurrentAudioUrl(url);
        setCurrentFilename(filename);
        setRefreshLibraryTrig(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-[#Fdfcf8]">
            {/* Studio Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200/50">
                <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80">
                            <Image
                                src="/LyrebirdLogo.png"
                                alt="Lyrebird Logo"
                                width={32}
                                height={32}
                                className="w-8 h-8 object-contain"
                            />
                            <span className="text-2xl italic text-amber-950 font-instrument-serif">Lyrebird.</span>
                        </Link>
                        <span className="text-gray-300 text-xl font-light">/</span>
                        <span className="text-amber-900/60 font-medium font-manrope tracking-wide uppercase text-xs">Studio</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="h-8 w-px bg-gray-200"></div>
                        <UserButton afterSignOutUrl="/" appearance={{
                            elements: {
                                userButtonAvatarBox: "w-9 h-9 border-2 border-white shadow-sm"
                            }
                        }} />
                    </div>
                </div>
            </header>

            {/* Main Workspace */}
            <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Left Column: Tools */}
                    <div className="lg:col-span-3 space-y-8 pb-24">

                        {/* 2. Script Editor */}
                        <section>
                            <h2 className="text-xl font-instrument-serif text-amber-950 mb-4 ml-1">Script Board</h2>
                            <ScriptEditor onScriptChange={setScriptLines} />
                        </section>

                        {/* 3. Generation Controls */}
                        <section>
                            <AudioGenerator
                                hostId={selectedHostId}
                                guestId={selectedGuestId}
                                scriptLines={scriptLines}
                                onAudioGenerated={handleAudioGenerated}
                            />
                        </section>
                    </div>

                    {/* Right Column: Library */}
                    <div className="lg:col-span-1">
                        <div className="lg:sticky lg:top-24 space-y-8 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                            <VoiceSelector
                                selectedHostId={selectedHostId}
                                selectedGuestId={selectedGuestId}
                                onSelectHost={setSelectedHostId}
                                onSelectGuest={setSelectedGuestId}
                            />
                            <AudioLibrary
                                onPlay={(url) => {
                                    setCurrentAudioUrl(url);
                                }}
                                refreshTrigger={refreshLibraryTrig}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Persistent Player Footer */}
            {currentAudioUrl && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 p-4 animate-in slide-in-from-bottom duration-300">
                    <div className="max-w-7xl mx-auto flex items-center gap-6">
                        <div className="flex-1">
                            <div className="text-xs text-gray-400 font-mono mb-1 uppercase tracking-widest">Now Playing</div>
                            <div className="text-sm font-bold text-gray-900 truncate max-w-[300px]">{currentFilename || "Generated Audio"}</div>
                        </div>
                        <audio
                            src={currentAudioUrl}
                            controls
                            autoPlay
                            className="w-full max-w-2xl h-10"
                        />
                        <button
                            onClick={() => setCurrentAudioUrl(null)}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
