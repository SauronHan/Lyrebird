"use client";

import Link from "next/link";

export default function Footer() {
    return (
        <section id="contact" className="bg-[#Fdfcf8] pb-6 px-4 md:px-6 relative z-30">
            <div className="w-full max-w-[90rem] mx-auto bg-[#07201D] rounded-[2.5rem] md:rounded-[3.5rem] text-[#F0F7F6] py-20 px-6 md:px-20 relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
                {/* Decorative Quote Icon */}
                <div className="flex justify-center mb-8 opacity-10 text-cyan-400">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="56"
                        height="56"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M10 11h-4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-2a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h3v-3zm10 0h-4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-2a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h3v-3z"></path>
                    </svg>
                </div>

                {/* Main Quote */}
                <div className="max-w-5xl mx-auto mb-16">
                    <h2 className="md:text-7xl leading-[1.1] text-4xl text-white tracking-tight font-instrument-serif mb-8">
                        "Your voice, reimagined."
                    </h2>
                    <p className="md:text-sm uppercase text-xs font-medium text-cyan-400/50 tracking-[0.25em] font-manrope">
                        — Lyrebird AI
                    </p>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-white/5 mb-16 max-w-6xl mx-auto"></div>

                {/* Bottom Content Stack */}
                <div className="flex flex-col gap-10 w-full gap-x-10 gap-y-10 items-center justify-center">
                    {/* Main Navigation */}
                    <nav className="flex flex-wrap justify-center gap-8 md:gap-16 text-cyan-100/80 uppercase tracking-[0.15em] text-xs font-bold font-manrope">
                        <Link href="#features" className="hover:text-white transition-colors">
                            Features
                        </Link>
                        <Link href="#showcase" className="hover:text-white transition-colors">
                            Showcase
                        </Link>
                        <Link href="#pricing" className="hover:text-white transition-colors">
                            Pricing
                        </Link>
                    </nav>

                    {/* Legal Links */}
                    <nav className="flex flex-wrap justify-center gap-6 md:gap-8 text-cyan-400/30 uppercase tracking-[0.1em] text-[10px] font-medium font-manrope">
                        <Link href="#" className="hover:text-cyan-200/50 transition-colors">
                            Legal Notice
                        </Link>
                        <Link href="#" className="hover:text-cyan-200/50 transition-colors">
                            Privacy Policy
                        </Link>
                    </nav>

                    {/* Brand & Copyright */}
                    <div className="flex items-center gap-3 text-cyan-400/40 text-xs mt-4">
                        <span className="font-instrument-serif italic text-2xl text-white opacity-90">
                            Lyrebird.
                        </span>
                        <span className="tracking-widest font-manrope text-[10px] mt-1">
                            © {new Date().getFullYear()}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
