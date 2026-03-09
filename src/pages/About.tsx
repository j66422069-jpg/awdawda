import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { AboutData } from "../types";
import { useContent } from "../context/ContentContext";

export default function About() {
  const { content, loading: contentLoading } = useContent();
  
  const data: AboutData = {
    profileImageUrl: content?.about_profileImageUrl || "",
    introText: content?.about_introText || "",
    about_services: content?.about_services || "",
    about_experience: content?.about_experience || ""
  };

  if (contentLoading && !content) return <div className="max-w-7xl mx-auto px-6 py-20 text-black/20 font-bold tracking-widest uppercase">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-xs font-bold tracking-[0.3em] text-black/40 uppercase mb-12">
          About Director
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-24">
          {/* Left: Profile Image */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="aspect-[3/4] overflow-hidden bg-black/5 border border-black/5">
              <img
                src={data.profileImageUrl || "https://picsum.photos/seed/profile/400/500"}
                alt="Profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Right: Intro Text */}
          <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-center">
            <h3 className="text-3xl font-bold tracking-tight mb-8">감독 소개</h3>
            <p className="text-lg text-black/70 leading-relaxed whitespace-pre-wrap max-w-3xl">
              {data.introText}
            </p>
          </div>
        </div>

        {/* Bottom: Capabilities & Career */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="p-10 bg-white border border-black/5">
            <h4 className="text-xs font-bold tracking-[0.2em] text-black/40 uppercase mb-6">
              Capabilities
            </h4>
            <h3 className="text-xl font-bold mb-6">가능 업무 범위</h3>
            <ul className="space-y-4">
              {(data.about_services || "").split("\n").filter(line => line.trim() !== "").map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-black/60">
                  <span className="mt-0.5 shrink-0">•</span>
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-10 bg-white border border-black/5">
            <h4 className="text-xs font-bold tracking-[0.2em] text-black/40 uppercase mb-6">
              Experience
            </h4>
            <h3 className="text-xl font-bold mb-6">주요 경력</h3>
            <ul className="space-y-4">
              {(data.about_experience || "").split("\n").filter(line => line.trim() !== "").map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-black/60">
                  <span className="mt-0.5 shrink-0">•</span>
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
