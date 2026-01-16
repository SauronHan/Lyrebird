"use client";

import { Mic, FileText, Music, Sparkles } from "lucide-react";

const features = [
    {
        title: "Voice Cloning",
        description: "Replicate any voice with just a few seconds of audio. Our advanced model captures tone, emotion, and cadence.",
        icon: Mic,
        color: "text-cyan-600",
    },
    {
        title: "Script Generation",
        description: "Don't have a script? Let our AI write engaging dialogue for you based on any topic or article.",
        icon: FileText,
        color: "text-purple-600",
    },
    {
        title: "Audio Production",
        description: "Generate full episodes with multiple speakers, sound effects, and background music instantly.",
        icon: Music,
        color: "text-green-600",
    },
    {
        title: "Emotion Control",
        description: "Direct the performance. Make your speakers sound happy, sad, excited, or serious with simple tags.",
        icon: Sparkles,
        color: "text-amber-600",
    },
];

export default function Features() {
    return (
        <section id="features" className="mt-40 mb-20 scroll-mt-32 px-4 md:px-12 max-w-[90rem] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                {/* Left Side */}
                <div className="md:col-span-4 flex flex-col items-start">
                    <h2 className="md:text-5xl serif text-4xl italic text-slate-900 mb-8 font-instrument-serif">
                        Our Features
                    </h2>
                    <p className="text-lg text-slate-600 mb-8 font-light">
                        Everything you need to create professional audio content efficiently.
                    </p>
                </div>

                {/* Right Side: Features List */}
                <div className="md:col-span-8 flex flex-col">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group py-8 border-b border-slate-300 cursor-pointer overflow-hidden transition-all duration-500"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="md:text-3xl text-2xl font-medium text-slate-400 group-hover:text-slate-900 transition-colors duration-300">
                                    {feature.title}
                                </span>
                                <div className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-300 group-hover:border-slate-900 group-hover:bg-slate-900 transition-all duration-300">
                                    <feature.icon className="w-5 h-5 text-stone-400 group-hover:text-white transition-all duration-300" />
                                </div>
                            </div>
                            <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-out">
                                <div className="overflow-hidden">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100 max-w-2xl pt-4">
                                        <p className="leading-relaxed text-lg font-light text-slate-600">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
