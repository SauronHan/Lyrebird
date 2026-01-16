"use client";

import { Play } from "lucide-react";

export default function Showcase() {
    return (
        <section id="showcase" className="md:pb-32 -mt-1 bg-[#Fdfcf8] z-20 pt-12 pb-20 relative px-6 md:px-12 max-w-[90rem] mx-auto">
            {/* Statement */}
            <div className="max-w-4xl mx-auto text-center mb-32 scroll-mt-32">
                <p className="md:text-5xl leading-[1.15] text-3xl font-medium text-slate-800 tracking-tight">
                    We empower creators to produce{" "}
                    <span className="serif md:text-6xl text-4xl italic text-cyan-600 font-instrument-serif">
                        studio-quality podcasts
                    </span>{" "}
                    without the studio.
                </p>
            </div>

            {/* Work Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-y-32 gap-x-12 gap-y-20 scroll-mt-32">
                {/* Project 1 */}
                <article className="group cursor-pointer">
                    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200 mb-6">
                        <div className="w-full h-full flex items-center justify-center bg-[#E8E6E1] group-hover:scale-105 transition-transform duration-700 ease-in-out">
                            <div className="w-32 h-32 rounded-full bg-cyan-400 mix-blend-multiply filter blur-2xl opacity-60"></div>
                            <div className="w-40 h-40 rounded-full bg-purple-400 mix-blend-multiply filter blur-2xl opacity-60 -ml-12"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-white/90 p-4 rounded-full shadow-lg">
                                <Play className="w-8 h-8 text-slate-900 fill-current" />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-300 pt-5 min-h-[5rem]">
                        <div>
                            <h3 className="md:text-4xl leading-none text-3xl text-slate-900 mb-1 font-instrument-serif">
                                Tech Daily
                            </h3>
                            <span className="text-lg text-slate-500">Technology News</span>
                        </div>
                    </div>
                </article>

                {/* Project 2 */}
                <article className="group cursor-pointer md:mt-24">
                    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200 mb-6">
                        <div className="w-full h-full flex items-center justify-center bg-[#E8E6E1] group-hover:scale-105 transition-transform duration-700 ease-in-out">
                            <div className="w-32 h-32 rounded-full bg-red-500 mix-blend-multiply filter blur-2xl opacity-60"></div>
                            <div className="w-40 h-40 rounded-full bg-orange-500 mix-blend-multiply filter blur-2xl opacity-60 -ml-12"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-white/90 p-4 rounded-full shadow-lg">
                                <Play className="w-8 h-8 text-slate-900 fill-current" />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-300 pt-5 min-h-[5rem]">
                        <div>
                            <h3 className="md:text-4xl leading-none text-3xl text-slate-900 mb-1 font-instrument-serif">
                                History Uncovered
                            </h3>
                            <span className="text-lg text-slate-500">Educational Series</span>
                        </div>
                    </div>
                </article>
            </div>
        </section>
    );
}
