import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Download } from "lucide-react";
import { motion } from "motion/react";
import { HomeData, ProjectData } from "../types";
import { useContent } from "../context/ContentContext";

export default function Home() {
  const { content, projects, loading: contentLoading, projectsLoaded } = useContent();

  const data: HomeData = {
    name: content?.home_name || "",
    role: content?.home_role || "",
    tagline: content?.home_tagline || "",
    resumeUrl: content?.home_resumeUrl || "",
    featuredProjectIds: Array.isArray(content?.home_featuredProjectIds) ? content.home_featuredProjectIds : []
  };

  const displayProjects = (Array.isArray(projects) ? projects : [])
    .filter(p => (p.featured === 1 || p.featured === true) && p.title && p.title.trim() !== "")
    .sort((a, b) => {
      // 1st priority: home_order (if > 0)
      const orderA = a.home_order && a.home_order > 0 ? a.home_order : 999999;
      const orderB = b.home_order && b.home_order > 0 ? b.home_order : 999999;
      
      if (orderA !== orderB) return orderA - orderB;
      
      // 2nd priority fallback: sort_order
      const sortA = a.sort_order && a.sort_order > 0 ? a.sort_order : 999999;
      const sortB = b.sort_order && b.sort_order > 0 ? b.sort_order : 999999;
      if (sortA !== sortB) return sortA - sortB;
      
      // 3rd priority fallback: id (created_at proxy)
      return (a.id || 0) - (b.id || 0);
    });

  if (contentLoading && !content) {
    return <div className="max-w-7xl mx-auto px-6 py-20 text-black/20 font-bold tracking-widest uppercase">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 overflow-hidden">
      {/* Hero Section */}
      <section className="mb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-xs font-bold tracking-[0.3em] text-black/40 uppercase mb-4">
            {data.role || "Cinematographer / Director"}
          </h2>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8">
            {data.name || "Director Name"}
          </h1>
          <p className="text-xl md:text-2xl text-black/60 max-w-2xl leading-relaxed mb-12 whitespace-pre-line">
            {data.tagline || "Capturing moments that tell a story."}
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link
              to="/projects"
              className="px-8 py-4 bg-black text-white text-sm font-medium tracking-widest flex items-center gap-2 hover:bg-black/90 transition-colors"
            >
              PROJECTS <ChevronRight size={16} />
            </Link>
            <a
              href={data.resumeUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-black/10 text-sm font-medium tracking-widest flex items-center gap-2 hover:bg-black/5 transition-colors"
            >
              이력서 다운로드 <Download size={16} />
            </a>
          </div>
        </motion.div>
      </section>

      {/* Featured Projects */}
      <section>
        <div className="flex items-end justify-between mb-12">
          <div>
            <h3 className="text-xs font-bold tracking-[0.3em] text-black/40 uppercase mb-2">
              Featured Work
            </h3>
            <h2 className="text-3xl font-bold tracking-tight">주요 작업</h2>
          </div>
          <Link to="/projects" className="text-xs font-bold tracking-widest border-b border-black pb-1 hover:text-black/60 hover:border-black/60 transition-all">
            VIEW ALL
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/projects/${project.id}`} className="group block">
                <div className="aspect-[16/9] overflow-hidden bg-black/5 mb-6">
                  <img
                    src={project.thumbnailUrl || "https://picsum.photos/seed/project/800/450"}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold tracking-tight mb-1 group-hover:text-black/60 transition-colors">
                      {project.title}
                    </h4>
                    <p className="text-sm text-black/40 font-medium tracking-widest uppercase">
                      {project.year} — {project.type}
                    </p>
                  </div>
                  <div className="w-10 h-10 border border-black/10 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
