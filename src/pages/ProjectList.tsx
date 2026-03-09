import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useContent } from "../context/ContentContext";

export default function ProjectList() {
  const { projects, fetchProjects, projectsLoaded } = useContent();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (!projectsLoaded && projects.length === 0) return <div className="max-w-7xl mx-auto px-6 py-20 text-black/20 font-bold tracking-widest uppercase">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-16">
          <h2 className="text-xs font-bold tracking-[0.3em] text-black/40 uppercase mb-4">
            Project Archive
          </h2>
          <h1 className="text-4xl font-bold tracking-tight">프로젝트 목록</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {[...projects]
            .filter(p => p.title && p.title.trim() !== "")
            .sort((a, b) => {
              const orderA = a.sort_order && a.sort_order > 0 ? a.sort_order : 999999;
              const orderB = b.sort_order && b.sort_order > 0 ? b.sort_order : 999999;
              
              if (orderA !== orderB) return orderA - orderB;
              return (a.id || 0) - (b.id || 0);
            })
            .map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/projects/${project.id}`} className="group block">
                <div className="aspect-[16/9] overflow-hidden bg-black/5 mb-6 border border-black/5">
                  <img
                    src={project.thumbnailUrl || "https://picsum.photos/seed/project/800/450"}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold tracking-tight group-hover:text-black/60 transition-colors">
                      {project.title}
                    </h3>
                    <span className="text-xs font-bold text-black/20">{project.year}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-black/5 text-[10px] font-bold tracking-widest uppercase text-black/40">
                      {project.category || ""}
                    </span>
                    <span className="px-2 py-1 bg-black/5 text-[10px] font-bold tracking-widest uppercase text-black/40">
                      {project.role}
                    </span>
                  </div>
                  <p className="text-sm text-black/60 leading-relaxed line-clamp-2">
                    {project.summary}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
