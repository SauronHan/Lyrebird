import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import Showcase from "@/components/home/Showcase";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Features />
        <Showcase />
      </main>
      <Footer />
    </div>
  );
}
