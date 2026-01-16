"use client";

import Link from "next/link";
import Image from "next/image";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <header className="absolute top-0 left-0 w-full z-50 pointer-events-none">
                <nav className="flex adaptive-text w-full max-w-[90rem] mx-auto px-8 py-8 items-center justify-between pointer-events-auto">
                    <Link
                        href="/"
                        className="hover:opacity-80 transition-opacity flex items-center gap-2 z-50 relative"
                    >
                        <Image
                            src="/LyrebirdLogo.png"
                            alt="Lyrebird Logo"
                            width={32}
                            height={32}
                            className="w-8 h-8 object-contain"
                        />
                        <span className="text-2xl italic text-amber-950 font-instrument-serif">Lyrebird.</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex gap-10 text-green-950 items-center">
                        <Link href="#features" className="hover:opacity-70 transition-opacity text-lg font-medium">
                            Features
                        </Link>
                        <Link href="#showcase" className="hover:opacity-70 transition-opacity text-lg font-medium">
                            Showcase
                        </Link>
                        <Link href="#pricing" className="hover:opacity-70 transition-opacity text-lg font-medium">
                            Pricing
                        </Link>
                    </div>

                    {/* Desktop CTA - Login */}
                    <div className="hidden md:block">
                        <SignedOut>
                            <SignInButton mode="modal" forceRedirectUrl="/studio">
                                <button className="hover:bg-white hover:text-black transition-colors text-lg font-medium text-amber-950 border-green-950 border rounded-full pt-2 pr-6 pb-2 pl-6">
                                    Login
                                </button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/studio"
                                    className="hover:bg-white hover:text-black transition-colors text-lg font-medium text-amber-950 border-green-950 border rounded-full pt-2 pr-6 pb-2 pl-6"
                                >
                                    Enter Studio
                                </Link>
                                <UserButton afterSignOutUrl="/" />
                            </div>
                        </SignedIn>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden relative z-50 p-1 text-slate-900"
                        aria-label="Menu"
                    >
                        {mobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
                    </button>
                </nav>
            </header>

            {/* Mobile Menu */}
            <div
                className={`fixed inset-0 z-[40] bg-[#Fdfcf8] flex flex-col items-center justify-center transition-opacity duration-300 md:hidden ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
            >
                <nav className="flex flex-col items-center gap-8 text-3xl font-instrument-serif italic text-slate-900">
                    <Link href="#features" onClick={() => setMobileMenuOpen(false)}>
                        Features
                    </Link>
                    <Link href="#showcase" onClick={() => setMobileMenuOpen(false)}>
                        Showcase
                    </Link>
                    <Link href="#pricing" onClick={() => setMobileMenuOpen(false)}>
                        Pricing
                    </Link>
                    <div className="mt-4 flex flex-col items-center gap-4">
                        <SignedOut>
                            <SignInButton mode="modal" forceRedirectUrl="/studio">
                                <button className="px-8 py-3 border border-slate-900 rounded-full font-manrope not-italic text-lg hover:bg-slate-900 hover:text-white transition-all">
                                    Login
                                </button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <Link
                                href="/studio"
                                onClick={() => setMobileMenuOpen(false)}
                                className="px-8 py-3 border border-slate-900 rounded-full font-manrope not-italic text-lg hover:bg-slate-900 hover:text-white transition-all"
                            >
                                Enter Studio
                            </Link>
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>
                    </div>
                </nav>
            </div>
        </>
    );
}
