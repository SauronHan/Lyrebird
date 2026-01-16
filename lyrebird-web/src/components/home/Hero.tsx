"use client";

import Link from "next/link";
import { ArrowDown } from "lucide-react";

export default function Hero() {
    return (
        <section className="flex flex-col overflow-hidden animate-gradient-bg md:min-h-[110vh] md:pt-40 min-h-[90vh] w-full z-0 pt-32 relative items-center justify-start">
            {/* Hero Content */}
            <div className="relative z-10 text-center px-4 adaptive-text mt-12 md:mt-20 pb-40">
                <h1 className="text-[15vw] md:text-[12vw] leading-[0.85] animate-hero-reveal tracking-tighter opacity-95">
                    Lyrebird <br />{" "}
                    <span className="font-light italic opacity-90">Studio</span>
                </h1>
                <p className="mt-8 text-xl md:text-2xl font-light opacity-0 animate-[heroReveal_1.2s_cubic-bezier(0.2,0.8,0.2,1)_forwards] animation-delay-500 text-white/90 max-w-2xl mx-auto">
                    Create lifelike AI podcasts with perfect emotion and clarity.
                </p>
            </div>

            {/* Hill Overlay */}
            <div className="hill-curve flex bg-[#Fdfcf8] w-full h-[35vh] z-20 absolute bottom-0 left-0 shadow-[0_-20px_60px_rgba(0,0,0,0.1)] justify-center items-start pt-12 md:pt-16">
                <Link
                    href="#features"
                    className="animate-gradient-bg hover:opacity-90 transition-all flex gap-x-2 gap-y-2 items-center group text-sm font-medium text-slate-900 rounded-full pt-3 pr-6 pb-3 pl-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                    <span className="group-hover:text-black transition-colors text-sm font-medium text-slate-800 tracking-tight">
                        Discover
                    </span>
                    <ArrowDown className="w-4 h-4 text-stone-700 group-hover:text-black transition-colors group-hover:translate-y-0.5 duration-300" />
                </Link>
            </div>
        </section>
    );
}
