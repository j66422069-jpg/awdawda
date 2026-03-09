import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronLeft, Camera, Layers, Sun, Palette } from "lucide-react";
import { useContent } from "../context/ContentContext";

export default function ProjectDetail() {
  const { id } = useParams();
  const { projectDetails, fetchProjectDetail } = useContent();
  const [loading, setLoading] = useState(!projectDetails[id || ""]);
  const [error, setError] = useState<string | null>(null);

  const project = id ? projectDetails[id] : null;
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  useEffect(() => {
    setSelectedVideoIndex(0);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (!projectDetails[id]) {
      setLoading(true);
      fetchProjectDetail(id)
        .then(data => {
          if (!data) setError("프로젝트를 찾을 수 없습니다.");
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [id, projectDetails, fetchProjectDetail]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-40 text-center">
        <p className="text-sm font-medium tracking-widest text-black/40 animate-pulse">LOADING...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-40 text-center">
        <p className="text-lg font-bold mb-8">{error || "프로젝트를 찾을 수 없습니다."}</p>
        <Link to="/projects" className="text-xs font-bold tracking-widest border-b border-black pb-1">
          BACK TO ARCHIVE
        </Link>
      </div>
    );
  }

  const getYoutubeId = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    } catch (e) {
      return null;
    }
  };

  const getYoutubeEmbedUrl = (url: string) => {
    const videoId = getYoutubeId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const getYoutubeThumbnail = (url: string) => {
    const id = getYoutubeId(url);
    if (!id) return null;
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
  };

  const videos = Array.isArray(project.videos) ? project.videos : [];
  const currentVideo = videos[selectedVideoIndex];

  const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link to="/projects" className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-black/40 hover:text-black transition-colors mb-12">
          <ChevronLeft size={14} /> BACK TO ARCHIVE
        </Link>

        {/* Basic Info */}
        <div className="mb-20">
          <div className="flex flex-wrap gap-3 mb-6">
            <span className="px-3 py-1 bg-black text-white text-[10px] font-bold tracking-[0.2em] uppercase">
              {project.category || ""}
            </span>
            <span className="px-3 py-1 border border-black/10 text-[10px] font-bold tracking-[0.2em] uppercase">
              {project.year}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
            {project.title}
          </h1>
          <p className="text-xl text-black/60 font-medium tracking-tight mb-8">
            {project.role}
          </p>
          <p className="text-lg text-black/70 leading-relaxed max-w-3xl whitespace-pre-wrap mb-12">
            {project.summary}
          </p>

          {project.description && (
            <div className="mt-12 pt-12 border-t border-black/5">
              <h2 className="text-xs font-bold tracking-[0.3em] text-black/40 uppercase mb-8">Description</h2>
              <p className="text-base text-black/70 leading-relaxed max-w-3xl whitespace-pre-wrap">
                {project.description}
              </p>
            </div>
          )}
        </div>

        {/* Video Section - Playlist Style */}
        <div className="mb-24">
          <div className={cn("grid grid-cols-1 gap-8", videos.length > 1 ? "lg:grid-cols-3" : "lg:grid-cols-1")}>
            {/* Main Player */}
            <div className={cn(videos.length > 1 ? "lg:col-span-2" : "lg:col-span-1")}>
              <div className="space-y-6">
                <div className="aspect-video bg-black overflow-hidden shadow-2xl">
                  {currentVideo && (
                    <iframe
                      key={selectedVideoIndex}
                      src={getYoutubeEmbedUrl(currentVideo.youtubeUrl)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
                {currentVideo && (
                  <div className="max-w-2xl">
                    <h3 className="text-xl font-bold tracking-tight mb-2">{currentVideo.title}</h3>
                    <p className="text-sm text-black/60 leading-relaxed whitespace-pre-wrap">{currentVideo.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Playlist */}
            {videos.length > 1 && (
              <div className="lg:col-span-1">
                <div className="bg-white border border-black/5 p-4 h-full max-h-[600px] overflow-y-auto">
                  <h3 className="text-[10px] font-bold tracking-widest uppercase text-black/40 mb-4 px-2">
                    Playlist ({videos.length})
                  </h3>
                  <div className="space-y-2">
                    {videos.map((video, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedVideoIndex(idx)}
                        className={cn(
                          "w-full flex gap-4 p-2 transition-colors text-left group",
                          selectedVideoIndex === idx ? "bg-black/5" : "hover:bg-black/[0.02]"
                        )}
                      >
                        <div className="relative w-24 h-14 bg-black/10 shrink-0 overflow-hidden">
                          <img
                            src={video.thumbnailUrl || getYoutubeThumbnail(video.youtubeUrl) || ""}
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          {selectedVideoIndex === idx && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="flex items-end gap-0.5 h-4">
                                <div className="w-1 bg-white animate-bounce" style={{ height: '60%' }} />
                                <div className="w-1 bg-white animate-bounce" style={{ height: '100%', animationDelay: '0.2s' }} />
                                <div className="w-1 bg-white animate-bounce" style={{ height: '40%', animationDelay: '0.4s' }} />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <p className={cn(
                            "text-[8px] font-bold tracking-widest uppercase mb-1",
                            selectedVideoIndex === idx ? "text-black" : "text-black/30"
                          )}>
                            Video {idx + 1}
                          </p>
                          <h4 className={cn(
                            "text-[11px] font-bold leading-tight line-clamp-2",
                            selectedVideoIndex === idx ? "text-black" : "text-black/60"
                          )}>
                            {video.title || "Untitled Video"}
                          </h4>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Technical Info */}
        <div className="border-t border-black/10 pt-20">
          <h2 className="text-xs font-bold tracking-[0.3em] text-black/40 uppercase mb-12">
            Technical Specifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="w-10 h-10 bg-black/5 flex items-center justify-center rounded-full">
                <Camera size={18} className="text-black/60" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold tracking-widest text-black/40 uppercase mb-1">Camera</h4>
                <p className="text-sm font-bold whitespace-pre-line">{project.tech?.camera || "—"}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="w-10 h-10 bg-black/5 flex items-center justify-center rounded-full">
                <Layers size={18} className="text-black/60" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold tracking-widest text-black/40 uppercase mb-1">Lens</h4>
                <p className="text-sm font-bold whitespace-pre-line">{project.tech?.lens || "—"}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="w-10 h-10 bg-black/5 flex items-center justify-center rounded-full">
                <Sun size={18} className="text-black/60" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold tracking-widest text-black/40 uppercase mb-1">Lighting</h4>
                <p className="text-sm font-bold whitespace-pre-line">{project.tech?.lighting || "—"}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="w-10 h-10 bg-black/5 flex items-center justify-center rounded-full">
                <Palette size={18} className="text-black/60" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold tracking-widest text-black/40 uppercase mb-1">Color</h4>
                <p className="text-sm font-bold whitespace-pre-line">{project.tech?.color || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
