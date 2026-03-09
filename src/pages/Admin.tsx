import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Save, Edit2, X, Upload, PlusCircle, Trash, ArrowUp, ArrowDown } from "lucide-react";
import { HomeData, AboutData, ProjectData, EquipmentItem, ContactData, VideoData } from "../types";
import { useContent } from "../context/ContentContext";

export default function Admin() {
  const { fetchContent, fetchProjects, fetchEquipment, updateContent, updateProjects, updateEquipment } = useContent();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [isSaving, setIsSaving] = useState(false);

  // Data States
  const [home, setHome] = useState<HomeData>({
    name: "", role: "", tagline: "", resumeUrl: "", featuredProjectIds: []
  });
  const [about, setAbout] = useState<AboutData>({
    profileImageUrl: "", introText: "", about_services: "", about_experience: ""
  });
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [contact, setContact] = useState<ContactData>({
    email: "", instagramUrl: "", instagramText: "", phone: "", resumeUrl: ""
  });
  const [equipmentDescription, setEquipmentDescription] = useState("");
  const [contactDescription, setContactDescription] = useState("");
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [hasHomeOrderChanged, setHasHomeOrderChanged] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (token) {
      setIsLoggedIn(true);
      setPassword(token);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const fetchData = async () => {
        try {
          const [contentRes, projectsRes, equipmentRes] = await Promise.all([
            fetch("/api/content"),
            fetch("/api/projects"),
            fetch("/api/equipment")
          ]);

          if (contentRes.ok) {
            const allContent = await contentRes.json();
            
            // Map Home
            setHome({
              name: allContent.home_name || "",
              role: allContent.home_role || "",
              tagline: allContent.home_tagline || "",
              resumeUrl: allContent.home_resumeUrl || "",
              featuredProjectIds: Array.isArray(allContent.home_featuredProjectIds) ? allContent.home_featuredProjectIds : []
            });

            // Map About
            setAbout({
              profileImageUrl: allContent.about_profileImageUrl || "",
              introText: allContent.about_introText || "",
              about_services: allContent.about_services || "",
              about_experience: allContent.about_experience || ""
            });

            // Map Contact
            setContact({
              email: allContent.contact_email || "",
              instagramUrl: allContent.contact_instagramUrl || "",
              instagramText: allContent.contact_instagramText || "",
              phone: allContent.contact_phone || "",
              resumeUrl: allContent.contact_resumeUrl || ""
            });

            setEquipmentDescription(allContent.equipment_description || "");
            setContactDescription(allContent.contact_description || "");
          }

          if (projectsRes.ok) {
            const json = await projectsRes.json();
            if (Array.isArray(json)) setProjects(json);
          }
          if (equipmentRes.ok) {
            const json = await equipmentRes.json();
            if (Array.isArray(json)) setEquipment(json);
          }
        } catch (error) {
          console.error("Failed to fetch admin data:", error);
        }
      };
      fetchData();
    }
  }, [isLoggedIn]);

  // Editing States
  const [editingProject, setEditingProject] = useState<Partial<ProjectData> | null>(null);
  const [editingEquipmentId, setEditingEquipmentId] = useState<number | string | null>(null);
  const [equipmentForm, setEquipmentForm] = useState({ name: "", note: "" });

  const startEditingProject = (project: any) => {
    // 1. Define default state
    const defaultState: ProjectData = {
      title: "",
      year: "",
      type: "",
      category: "",
      description: "",
      role: "",
      summary: "",
      featured: false,
      sort_order: 0,
      home_order: 0,
      thumbnailUrl: "",
      tech: { camera: "", lens: "", lighting: "", color: "" },
      videos: []
    };

    // 2. Merge with actual project data safely
    // Use the project data as base, fallback to defaults only if missing
    const formState: ProjectData = {
      ...defaultState,
      ...project,
      // Deep merge for tech and videos to ensure they are always objects/arrays
      tech: {
        camera: project.tech?.camera || project.tech_camera || "",
        lens: project.tech?.lens || project.tech_lens || "",
        lighting: project.tech?.lighting || project.tech_lighting || "",
        color: project.tech?.color || project.tech_color || ""
      },
      videos: Array.isArray(project.videos) ? project.videos : []
    };

    // 3. Mandatory logs
    console.log("edit screen opened");
    console.log("original project", project);
    console.log("form state initialized", formState);
    console.log("no save request on open");
    console.log("projects list state unchanged", projects);

    // 4. Set state (This is a separate state from the projects list)
    setEditingProject(formState);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we'd verify this with the server, but for now we'll store it
    // and let the subsequent API calls fail if the token is invalid.
    if (password) {
      sessionStorage.setItem("admin_token", password);
      setIsLoggedIn(true);
    } else {
      alert("비밀번호를 입력해주세요.");
    }
  };

  const getAuthHeaders = (contentType: string | null = "application/json") => {
    const token = sessionStorage.getItem("admin_token");
    const headers: Record<string, string> = {
      "x-admin-token": token || ""
    };
    if (contentType) {
      headers["Content-Type"] = contentType;
    }
    return headers;
  };

  const handleAuthError = async (res: Response) => {
    if (res.status === 401) {
      alert("인증이 만료되었거나 비밀번호가 틀렸습니다. 다시 로그인해주세요.");
      sessionStorage.removeItem("admin_token");
      setIsLoggedIn(false);
      return true;
    }
    return false;
  };

  const saveHome = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        home_name: home.name,
        home_role: home.role,
        home_tagline: home.tagline,
        home_resumeUrl: home.resumeUrl,
        home_featuredProjectIds: home.featuredProjectIds
      };
      const res = await fetch("/api/content", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (await handleAuthError(res)) return;
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "저장에 실패했습니다.");
      }
      updateContent(payload);
      alert("저장되었습니다.");
    } catch (error: any) {
      console.error("Save Home error:", error);
      alert(`저장 실패: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const saveAbout = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        about_profileImageUrl: about.profileImageUrl,
        about_introText: about.introText,
        about_services: about.about_services,
        about_experience: about.about_experience
      };
      const res = await fetch("/api/content", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (await handleAuthError(res)) return;
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "저장에 실패했습니다.");
      }
      updateContent(payload);
      alert("저장되었습니다.");
    } catch (error: any) {
      console.error("Save About error:", error);
      alert(`저장 실패: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const saveContact = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        contact_email: contact.email,
        contact_instagramUrl: contact.instagramUrl,
        contact_instagramText: contact.instagramText,
        contact_phone: contact.phone,
        contact_resumeUrl: contact.resumeUrl
      };
      const res = await fetch("/api/content", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (await handleAuthError(res)) return;
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "저장에 실패했습니다.");
      }
      updateContent(payload);
      alert("저장되었습니다.");
    } catch (error: any) {
      console.error("Save Contact error:", error);
      alert(`저장 실패: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const saveProject = async () => {
    if (!editingProject || isSaving) return;
    
    // Prevent saving project without title
    if (!editingProject.title || editingProject.title.trim() === "") {
      alert("프로젝트 제목을 입력해주세요.");
      return;
    }

    // Additional defensive check for empty project
    const hasTitle = editingProject.title && editingProject.title.trim() !== "";
    const hasDescription = editingProject.description && editingProject.description.trim() !== "";
    const hasThumbnail = editingProject.thumbnailUrl && editingProject.thumbnailUrl.trim() !== "";
    
    if (!hasTitle && !hasDescription && !hasThumbnail) {
      alert("최소한 제목, 설명, 또는 썸네일 중 하나는 입력해야 합니다.");
      return;
    }

    setIsSaving(true);
    const method = editingProject.id ? "PUT" : "POST";
    const url = editingProject.id ? `/api/projects?id=${editingProject.id}` : "/api/projects";
    
    // For new projects, set sort_order to be at the top
    const projectToSave = { ...editingProject };
    if (!projectToSave.id) {
      const minOrder = projects.length > 0 
        ? Math.min(...projects.map(p => p.sort_order || 0)) 
        : 0;
      projectToSave.sort_order = minOrder - 1;
    }
    
    // Log payload for verification
    console.log(`[SAVE PROJECT] Method: ${method}, Payload:`, projectToSave);
    
    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(projectToSave),
      });
      
      if (await handleAuthError(res)) return;

      if (!res.ok) {
        const errorData = await res.json();
        alert(`저장 실패: ${errorData.error || "알 수 없는 오류"}\n${errorData.details || ""}`);
        return;
      }

      const savedProject = await res.json();
      const projectId = editingProject.id || savedProject.id;
      
      // Fetch full project list to ensure correct order and data
      const projectsRes = await fetch("/api/projects");
      if (projectsRes.ok) {
        const updatedProjects = await projectsRes.json();
        setProjects(updatedProjects);
        updateProjects(updatedProjects);
      }
      
      setEditingProject(null);
      setHasOrderChanged(false);
      alert("저장되었습니다.");
    } catch (error) {
      console.error("Save Project error:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const moveProject = (index: number, direction: 'up' | 'down') => {
    const newProjects = [...projects];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newProjects.length) return;
    
    [newProjects[index], newProjects[targetIndex]] = [newProjects[targetIndex], newProjects[index]];
    
    // Update sort_order for all items based on their new index
    const updated = newProjects.map((p, idx) => ({ ...p, sort_order: idx + 1 }));
    
    setProjects(updated);
    setHasOrderChanged(true);
  };

  const moveHomeProject = (index: number, direction: 'up' | 'down') => {
    const featuredProjects = projects.filter(p => p.featured === 1 || p.featured === true)
                                     .sort((a, b) => {
                                       const orderA = a.home_order && a.home_order > 0 ? a.home_order : 999999;
                                       const orderB = b.home_order && b.home_order > 0 ? b.home_order : 999999;
                                       if (orderA !== orderB) return orderA - orderB;
                                       return (a.id || 0) - (b.id || 0);
                                     });
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= featuredProjects.length) return;
    
    const newFeatured = [...featuredProjects];
    [newFeatured[index], newFeatured[targetIndex]] = [newFeatured[targetIndex], newFeatured[index]];
    
    // Update the main projects list with new home_order
    const updatedProjects = projects.map(p => {
      const featuredIdx = newFeatured.findIndex(nf => nf.id === p.id);
      if (featuredIdx !== -1) {
        return { ...p, home_order: featuredIdx + 1 };
      }
      return p;
    });
    
    setProjects(updatedProjects);
    setHasHomeOrderChanged(true);
  };

  const handleSaveProjectOrder = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSaving) return;
    
    // 1. Get current projects from state (reflects UI order)
    const validProjects = projects.filter(p => {
      if (!p || !p.id) return false;
      const title = (p.title || "").trim();
      if (!title) return false;
      if (p.id === "new" || p.id === 0) return false;
      return true;
    });
    
    // 2. Create payload with ONLY id and sort_order
    const payload = validProjects.map((p, index) => ({
      id: p.id,
      sort_order: index + 1
    }));
    
    // 3. Mandatory console logs
    console.log("REORDER SAVE TRIGGERED");
    console.log("Payload:", payload);
    
    if (payload.length === 0) {
      alert("저장할 유효한 프로젝트가 없습니다.");
      return;
    }

    setIsSaving(true);
    
    try {
      const res = await fetch("/api/projects/reorder", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      
      if (await handleAuthError(res)) return;
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "순서 저장에 실패했습니다.");
      }
      
      // Update context state with current local state
      updateProjects(projects);
      
      setHasOrderChanged(false);
      alert("전체 프로젝트 순서가 저장되었습니다.");
    } catch (error: any) {
      console.error("Save Project Order error:", error);
      alert(`순서 저장 실패: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHomeOrder = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSaving) return;
    
    // 1. Get featured projects
    const featuredProjects = projects.filter(p => {
      if (!p || !p.id) return false;
      if (!(p.featured === 1 || p.featured === true)) return false;
      const title = (p.title || "").trim();
      if (!title) return false;
      return true;
    });
    
    // 2. Sort them exactly as they are displayed in the UI
    const sortedFeatured = [...featuredProjects].sort((a, b) => {
      const orderA = a.home_order && a.home_order > 0 ? a.home_order : 999999;
      const orderB = b.home_order && b.home_order > 0 ? b.home_order : 999999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.id || 0) - (b.id || 0);
    });
    
    // 3. Create payload with ONLY id and home_order
    const payload = sortedFeatured.map((p, index) => ({
      id: p.id,
      home_order: index + 1
    }));
    
    // 4. Mandatory console logs
    console.log("REORDER SAVE TRIGGERED");
    console.log("Payload:", payload);
    
    if (payload.length === 0) {
      alert("저장할 유효한 주요작업이 없습니다.");
      return;
    }

    setIsSaving(true);
    
    try {
      const res = await fetch("/api/projects/reorder-home", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      
      if (await handleAuthError(res)) return;
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "HOME 순서 저장에 실패했습니다.");
      }
      
      // Update context state with current local state
      updateProjects(projects);
      
      setHasHomeOrderChanged(false);
      alert("HOME 주요작업 순서가 저장되었습니다.");
    } catch (error: any) {
      console.error("Save Home Order error:", error);
      alert(`HOME 순서 저장 실패: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };


  const deleteProject = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?") || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects?id=${id}`, { 
        method: "DELETE",
        headers: getAuthHeaders(null)
      });
      if (await handleAuthError(res)) return;
      
      const newProjects = projects.filter(p => p.id !== id);
      setProjects(newProjects);
      updateProjects(newProjects);
    } catch (error) {
      console.error("Delete Project error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveEquipment = async (item: EquipmentItem) => {
    if (isSaving) return;
    setIsSaving(true);
    const method = item.id ? "PUT" : "POST";
    const url = item.id ? `/api/equipment?id=${item.id}` : "/api/equipment";
    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(item),
      });
      if (await handleAuthError(res)) return;
      
      const savedData = await res.json();
      const itemId = item.id || savedData.id;
      const updatedItem = { ...item, id: itemId };
      
      const newEquipment = item.id 
        ? equipment.map(e => e.id === itemId ? updatedItem : e)
        : [...equipment, updatedItem];
      
      setEquipment(newEquipment);
      updateEquipment(newEquipment);
    } catch (error) {
      console.error("Save Equipment error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEquipment = async (id: number) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/equipment?id=${id}`, { 
        method: "DELETE",
        headers: getAuthHeaders(null)
      });
      if (await handleAuthError(res)) return;
      
      const newEquipment = equipment.filter(e => e.id !== id);
      setEquipment(newEquipment);
      updateEquipment(newEquipment);
    } catch (error) {
      console.error("Delete Equipment error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ image: reader.result as string }),
        });
        if (await handleAuthError(res)) return;
        const { url } = await res.json();
        setEditingProject(prev => prev ? { ...prev, thumbnailUrl: url } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAboutImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && about) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ image: reader.result as string }),
        });
        if (await handleAuthError(res)) return;
        const { url } = await res.json();
        setAbout({ ...about, profileImageUrl: url });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <form onSubmit={handleLogin} className="w-full max-w-sm p-12 bg-white border border-black/5 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight mb-8 text-center">ADMIN LOGIN</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-black/10 text-sm mb-6 focus:outline-none focus:border-black transition-colors"
          />
          <button type="submit" className="w-full py-4 bg-black text-white text-xs font-bold tracking-widest uppercase hover:bg-black/90 transition-colors">
            LOGIN
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar Tabs */}
        <div className="md:w-64 shrink-0">
          <h2 className="text-xs font-bold tracking-[0.3em] text-black/40 uppercase mb-8">Admin Dashboard</h2>
          <div className="flex flex-col space-y-2">
            {["home", "about", "projects", "equipment", "contact"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-left px-6 py-4 text-xs font-bold tracking-widest uppercase transition-all ${
                  activeTab === tab ? "bg-black text-white" : "hover:bg-black/5 text-black/40"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white border border-black/5 p-12">
          {activeTab === "home" && (
            <div className="space-y-8">
              <h3 className="text-xl font-bold mb-8">HOME 설정</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">이름</label>
                  <input
                    type="text"
                    value={home.name}
                    onChange={(e) => setHome({ ...home, name: e.target.value })}
                    className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">직무</label>
                  <input
                    type="text"
                    value={home.role}
                    onChange={(e) => setHome({ ...home, role: e.target.value })}
                    className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">한 줄 소개</label>
                  <textarea
                    value={home.tagline}
                    onChange={(e) => setHome({ ...home, tagline: e.target.value })}
                    className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black h-24"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">이력서 링크 (Google Drive)</label>
                  <input
                    type="text"
                    value={home.resumeUrl}
                    onChange={(e) => setHome({ ...home, resumeUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black"
                  />
                </div>
              </div>
              <button 
                onClick={saveHome} 
                disabled={isSaving}
                className={`px-8 py-4 bg-black text-white text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-opacity ${isSaving ? "opacity-50 cursor-not-allowed" : "hover:bg-black/90"}`}
              >
                <Save size={16} /> {isSaving ? "SAVING..." : "SAVE CHANGES"}
              </button>

              <div className="pt-12 border-t border-black/5">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold">HOME 주요작업 순서</h3>
                  {hasHomeOrderChanged && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSaveHomeOrder(e);
                      }}
                      disabled={isSaving}
                      className="px-6 py-3 bg-emerald-600 text-white text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 hover:bg-emerald-700 transition-colors"
                    >
                      <Save size={14} /> SAVE HOME ORDER
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {projects.filter(p => p.featured === 1 || p.featured === true)
                    .sort((a, b) => {
                      const orderA = a.home_order && a.home_order > 0 ? a.home_order : 999999;
                      const orderB = b.home_order && b.home_order > 0 ? b.home_order : 999999;
                      if (orderA !== orderB) return orderA - orderB;
                      return (a.id || 0) - (b.id || 0);
                    })
                    .map((p, idx, filteredArr) => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-black/5 border border-black/5">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-black/20 w-4">{idx + 1}</span>
                        <div className="w-12 h-8 bg-black/10 overflow-hidden">
                          {p.thumbnailUrl && <img src={p.thumbnailUrl} className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-xs font-bold">{p.title}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => moveHomeProject(idx, 'up')}
                          disabled={idx === 0}
                          className="p-2 hover:bg-black/5 disabled:opacity-20"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => moveHomeProject(idx, 'down')}
                          disabled={idx === filteredArr.length - 1}
                          className="p-2 hover:bg-black/5 disabled:opacity-20"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {projects.filter(p => p.featured === 1 || p.featured === true).length === 0 && (
                    <p className="text-xs text-black/40 italic py-8 text-center">주요 작업으로 설정된 프로젝트가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "about" && (
            <div className="space-y-8">
              <h3 className="text-xl font-bold mb-8">ABOUT 설정</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">프로필 이미지 업로드</label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-32 bg-black/5 border border-black/5 overflow-hidden">
                      {about.profileImageUrl && <img src={about.profileImageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                    </div>
                    <label className="px-6 py-3 border border-black/10 text-[10px] font-bold tracking-widest uppercase cursor-pointer hover:bg-black/5 transition-colors">
                      파일 선택
                      <input type="file" className="hidden" onChange={handleAboutImageUpload} accept="image/*" />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">자기소개</label>
                  <textarea
                    value={about.introText}
                    onChange={(e) => setAbout({ ...about, introText: e.target.value })}
                    className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black h-48"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">가능 업무 범위 (엔터로 구분)</label>
                  <textarea
                    value={about.about_services}
                    onChange={(e) => setAbout({ ...about, about_services: e.target.value })}
                    className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black h-32"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">경력 사항 (엔터로 구분)</label>
                  <textarea
                    value={about.about_experience}
                    onChange={(e) => setAbout({ ...about, about_experience: e.target.value })}
                    className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black h-32"
                  />
                </div>
              </div>
              <button 
                onClick={saveAbout} 
                disabled={isSaving}
                className={`px-8 py-4 bg-black text-white text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-opacity ${isSaving ? "opacity-50 cursor-not-allowed" : "hover:bg-black/90"}`}
              >
                <Save size={16} /> {isSaving ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold">PROJECT 관리</h3>
                <div className="flex gap-4">
                  {hasOrderChanged && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSaveProjectOrder(e);
                      }}
                      disabled={isSaving}
                      className="px-6 py-3 bg-emerald-600 text-white text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 hover:bg-emerald-700 transition-colors"
                    >
                      <Save size={14} /> SAVE ORDER
                    </button>
                  )}
                  <button
                    onClick={() => startEditingProject({})}
                    className="px-6 py-3 bg-black text-white text-[10px] font-bold tracking-widest uppercase flex items-center gap-2"
                  >
                    <Plus size={14} /> ADD PROJECT
                  </button>
                </div>
              </div>

              {editingProject ? (
                <div className="space-y-8 border-t border-black/5 pt-8">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold">{editingProject.id ? "프로젝트 수정" : "새 프로젝트 추가"}</h4>
                    <button onClick={() => setEditingProject(null)}><X size={20} /></button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">제목</label>
                      <input
                        type="text"
                        value={editingProject.title || ""}
                        onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                        className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">연도</label>
                      <input
                        type="text"
                        value={editingProject.year || ""}
                        onChange={(e) => setEditingProject({ ...editingProject, year: e.target.value })}
                        className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">형태 (예: 단편영화, 광고)</label>
                      <input
                        type="text"
                        value={editingProject.category || ""}
                        onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                        className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">역할 (예: 촬영감독, 촬영팀)</label>
                      <input
                        type="text"
                        value={editingProject.role || ""}
                        onChange={(e) => setEditingProject({ ...editingProject, role: e.target.value })}
                        className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">한 줄 요약</label>
                    <textarea
                      value={editingProject.summary || ""}
                      onChange={(e) => setEditingProject({ ...editingProject, summary: e.target.value })}
                      className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black h-24"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">Description</label>
                    <textarea
                      value={editingProject.description || ""}
                      onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                      className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black h-48"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">썸네일 업로드</label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-14 bg-black/5 border border-black/5 overflow-hidden">
                          {editingProject.thumbnailUrl && <img src={editingProject.thumbnailUrl} className="w-full h-full object-cover" />}
                        </div>
                        <label className="px-4 py-2 border border-black/10 text-[10px] font-bold tracking-widest uppercase cursor-pointer hover:bg-black/5">
                          UPLOAD <input type="file" className="hidden" onChange={handleThumbnailUpload} accept="image/*" />
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="featured"
                          checked={editingProject.featured}
                          onChange={(e) => {
                            const isFeatured = e.target.checked;
                            setEditingProject({ 
                              ...editingProject, 
                              featured: isFeatured,
                              home_order: isFeatured ? (editingProject.home_order || 0) : 0
                            });
                          }}
                        />
                        <label htmlFor="featured" className="text-xs font-bold tracking-widest uppercase">주요 작업으로 표시 (HOME)</label>
                      </div>
                      
                      {editingProject.featured && (
                        <div className="flex items-center gap-4">
                          <label className="text-[10px] font-bold tracking-widest uppercase text-black/40">주요 작업 순서</label>
                          <select
                            value={editingProject.home_order || 0}
                            onChange={(e) => {
                              const newOrder = parseInt(e.target.value);
                              // Check if this order is already taken by another project
                              const existing = projects.find(p => p.home_order === newOrder && p.id !== editingProject.id);
                              if (existing && newOrder !== 0) {
                                if (confirm(`이미 '${existing.title}' 프로젝트가 ${newOrder}번 순서를 사용 중입니다. 이 프로젝트로 변경하시겠습니까?`)) {
                                  setEditingProject({ ...editingProject, home_order: newOrder });
                                }
                              } else {
                                setEditingProject({ ...editingProject, home_order: newOrder });
                              }
                            }}
                            className="px-3 py-1 border border-black/10 text-xs focus:outline-none focus:border-black"
                          >
                            <option value={0}>순서 선택 안함</option>
                            {[1, 2, 3, 4, 5, 6].map(num => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tech Info */}
                  <div className="p-6 bg-black/5 space-y-4">
                    <h5 className="text-[10px] font-bold tracking-widest uppercase text-black/40">Technical Info</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {["camera", "lens", "lighting", "color"].map((key) => (
                        <div key={key}>
                          <label className="block text-[8px] font-bold tracking-widest uppercase text-black/40 mb-1">{key}</label>
                          <textarea
                            value={(editingProject.tech as any)?.[key] || ""}
                            onChange={(e) => setEditingProject({
                              ...editingProject,
                              tech: { ...(editingProject.tech || {}), [key]: e.target.value }
                            })}
                            className="w-full px-2 py-2 border border-black/10 text-xs focus:outline-none focus:border-black h-20 resize-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Videos */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[10px] font-bold tracking-widest uppercase text-black/40">Videos (YouTube)</h5>
                      <button
                        onClick={() => setEditingProject({
                          ...editingProject,
                          videos: [...(editingProject.videos || []), { title: "", description: "", youtubeUrl: "" }]
                        })}
                        className="text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 text-black/60 hover:text-black"
                      >
                        <PlusCircle size={12} /> ADD VIDEO
                      </button>
                    </div>
                    <div className="space-y-4">
                      {(Array.isArray(editingProject.videos) ? editingProject.videos : []).map((v, idx) => (
                        <div key={idx} className="p-6 border border-black/10 relative">
                          <button
                            onClick={() => {
                              const newVideos = [...editingProject.videos!];
                              newVideos.splice(idx, 1);
                              setEditingProject({ ...editingProject, videos: newVideos });
                            }}
                            className="absolute top-4 right-4 text-black/20 hover:text-red-500"
                          >
                            <Trash size={16} />
                          </button>
                          <div className="grid grid-cols-1 gap-4">
                            <input
                              type="text"
                              placeholder="Video Title"
                              value={v.title}
                              onChange={(e) => {
                                const newVideos = [...(editingProject.videos || [])];
                                newVideos[idx] = { ...newVideos[idx], title: e.target.value };
                                setEditingProject({ ...editingProject, videos: newVideos });
                              }}
                              className="w-full px-3 py-2 border border-black/10 text-xs focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="YouTube URL"
                              value={v.youtubeUrl}
                              onChange={(e) => {
                                const newVideos = [...(editingProject.videos || [])];
                                newVideos[idx] = { ...newVideos[idx], youtubeUrl: e.target.value };
                                setEditingProject({ ...editingProject, videos: newVideos });
                              }}
                              className="w-full px-3 py-2 border border-black/10 text-xs focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Video Thumbnail URL (Optional)"
                              value={v.thumbnailUrl || ""}
                              onChange={(e) => {
                                const newVideos = [...(editingProject.videos || [])];
                                newVideos[idx] = { ...newVideos[idx], thumbnailUrl: e.target.value };
                                setEditingProject({ ...editingProject, videos: newVideos });
                              }}
                              className="w-full px-3 py-2 border border-black/10 text-xs focus:outline-none"
                            />
                            <textarea
                              placeholder="Description"
                              value={v.description}
                              onChange={(e) => {
                                const newVideos = [...(editingProject.videos || [])];
                                newVideos[idx] = { ...newVideos[idx], description: e.target.value };
                                setEditingProject({ ...editingProject, videos: newVideos });
                              }}
                              className="w-full px-3 py-2 border border-black/10 text-xs focus:outline-none h-20"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={saveProject} 
                    disabled={isSaving}
                    className={`w-full py-4 bg-black text-white text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-opacity ${isSaving ? "opacity-50 cursor-not-allowed" : "hover:bg-black/90"}`}
                  >
                    <Save size={16} /> {isSaving ? "SAVING..." : "SAVE PROJECT"}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {(Array.isArray(projects) ? projects : [])
                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                    .map((p, index) => (
                    <div key={p.id} className="flex items-center justify-between p-6 border border-black/5 hover:border-black/20 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col gap-1">
                          <button 
                            onClick={() => moveProject(index, 'up')}
                            disabled={index === 0}
                            className={`p-1 ${index === 0 ? 'text-black/5' : 'text-black/20 hover:text-black'}`}
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button 
                            onClick={() => moveProject(index, 'down')}
                            disabled={index === projects.length - 1}
                            className={`p-1 ${index === projects.length - 1 ? 'text-black/5' : 'text-black/20 hover:text-black'}`}
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                        <div className="w-20 h-12 bg-black/5 overflow-hidden">
                          {p.thumbnailUrl && <img src={p.thumbnailUrl} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <h4 className="font-bold">{p.title}</h4>
                          <p className="text-[10px] font-bold tracking-widest text-black/40 uppercase">{p.year} — {p.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={async () => {
                            const res = await fetch(`/api/projects?id=${p.id}`);
                            if (res.ok) {
                              const fullProject = await res.json();
                              startEditingProject(fullProject);
                            }
                          }} 
                          className="p-2 text-black/40 hover:text-black"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => deleteProject(p.id!)} className="p-2 text-black/40 hover:text-red-500"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "equipment" && (
            <div className="space-y-8">
              <h3 className="text-xl font-bold mb-8">EQUIPMENT 관리</h3>
              
              <div className="mb-12 p-6 bg-black/5 space-y-4">
                <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40">EQUIPMENT 페이지 부가설명</label>
                <textarea
                  value={equipmentDescription}
                  onChange={(e) => setEquipmentDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black h-24"
                  placeholder="EQUIPMENT 페이지 상단에 표시될 설명을 입력하세요."
                />
                <button 
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      await fetch("/api/content", {
                        method: "POST",
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ equipment_description: equipmentDescription }),
                      });
                      updateContent({ equipment_description: equipmentDescription });
                      alert("설명이 저장되었습니다.");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  className="px-6 py-2 bg-black text-white text-[10px] font-bold tracking-widest uppercase hover:bg-black/90 transition-colors"
                >
                  설명 저장
                </button>
              </div>

              <div className="space-y-12">
                {["Camera", "Lens", "Lighting", "Color"].map((cat) => (
                  <div key={cat} className="space-y-4">
                <div className="flex items-center justify-between border-b border-black/10 pb-2">
                  <h4 className="text-sm font-bold tracking-widest uppercase">{cat}</h4>
                  <button
                    onClick={() => {
                      setEditingEquipmentId(`new-${cat}`);
                      setEquipmentForm({ name: "", note: "" });
                    }}
                    className="text-[10px] font-bold tracking-widest uppercase text-black/40 hover:text-black"
                  >
                    + ADD ITEM
                  </button>
                </div>
                    <div className="grid grid-cols-1 gap-2">
                      {(Array.isArray(equipment) ? equipment : []).filter(e => e.category === cat).map((item) => (
                        <div key={item.id}>
                          {editingEquipmentId === item.id ? (
                            <div className="p-4 bg-black/5 space-y-3 border border-black/20">
                              <input
                                type="text"
                                placeholder="장비명"
                                value={equipmentForm.name}
                                onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                                className="w-full px-3 py-2 border border-black/10 text-sm focus:outline-none"
                              />
                              <input
                                type="text"
                                placeholder="운용 역량 또는 특징"
                                value={equipmentForm.note}
                                onChange={(e) => setEquipmentForm({ ...equipmentForm, note: e.target.value })}
                                className="w-full px-3 py-2 border border-black/10 text-sm focus:outline-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    await saveEquipment({ ...item, ...equipmentForm });
                                    setEditingEquipmentId(null);
                                  }}
                                  disabled={isSaving}
                                  className={`px-4 py-2 bg-black text-white text-[10px] font-bold tracking-widest uppercase transition-opacity ${isSaving ? "opacity-50 cursor-not-allowed" : "hover:bg-black/90"}`}
                                >
                                  {isSaving ? "SAVING..." : "SAVE"}
                                </button>
                                <button
                                  onClick={() => setEditingEquipmentId(null)}
                                  className="px-4 py-2 border border-black/10 text-[10px] font-bold tracking-widest uppercase"
                                >
                                  CANCEL
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-4 bg-black/5">
                              <div>
                                <p className="text-sm font-bold">{item.name}</p>
                                <p className="text-[10px] text-black/40 italic">{item.note}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingEquipmentId(item.id!);
                                    setEquipmentForm({ name: item.name, note: item.note });
                                  }}
                                  className="p-1 text-black/20 hover:text-black"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => deleteEquipment(item.id!)} className="p-1 text-black/20 hover:text-red-500">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {editingEquipmentId === `new-${cat}` && (
                        <div className="p-4 bg-black/5 space-y-3 border-2 border-black/10">
                          <input
                            type="text"
                            placeholder="장비명"
                            value={equipmentForm.name}
                            onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-black/10 text-sm focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="운용 역량 또는 특징"
                            value={equipmentForm.note}
                            onChange={(e) => setEquipmentForm({ ...equipmentForm, note: e.target.value })}
                            className="w-full px-3 py-2 border border-black/10 text-sm focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                if (!equipmentForm.name) return alert("장비명을 입력하세요.");
                                await saveEquipment({ category: cat as any, ...equipmentForm });
                                setEditingEquipmentId(null);
                              }}
                              disabled={isSaving}
                              className={`px-4 py-2 bg-black text-white text-[10px] font-bold tracking-widest uppercase transition-opacity ${isSaving ? "opacity-50 cursor-not-allowed" : "hover:bg-black/90"}`}
                            >
                              {isSaving ? "SAVING..." : "SAVE"}
                            </button>
                            <button
                              onClick={() => setEditingEquipmentId(null)}
                              className="px-4 py-2 border border-black/10 text-[10px] font-bold tracking-widest uppercase"
                            >
                              CANCEL
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-8">
              <h3 className="text-xl font-bold mb-8">CONTACT 설정</h3>

              <div className="mb-12 p-6 bg-black/5 space-y-4">
                <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40">CONTACT 페이지 부가설명</label>
                <textarea
                  value={contactDescription}
                  onChange={(e) => setContactDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black h-24"
                  placeholder="CONTACT 페이지 상단에 표시될 설명을 입력하세요."
                />
                <button 
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      await fetch("/api/content", {
                        method: "POST",
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ contact_description: contactDescription }),
                      });
                      updateContent({ contact_description: contactDescription });
                      alert("설명이 저장되었습니다.");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  className="px-6 py-2 bg-black text-white text-[10px] font-bold tracking-widest uppercase hover:bg-black/90 transition-colors"
                >
                  설명 저장
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">Email</label>
                  <input
                    type="text"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">Phone</label>
                  <input
                    type="text"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">Instagram URL</label>
                  <input
                    type="text"
                    value={contact.instagramUrl}
                    onChange={(e) => setContact({ ...contact, instagramUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">Instagram Text (e.g., @cinematographer)</label>
                  <input
                    type="text"
                    value={contact.instagramText || ""}
                    onChange={(e) => setContact({ ...contact, instagramText: e.target.value })}
                    className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">이력서 링크 (Google Drive)</label>
                  <input
                    type="text"
                    value={contact.resumeUrl}
                    onChange={(e) => setContact({ ...contact, resumeUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black"
                  />
                </div>
              </div>
              <button 
                onClick={saveContact} 
                disabled={isSaving}
                className={`px-8 py-4 bg-black text-white text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-opacity ${isSaving ? "opacity-50 cursor-not-allowed" : "hover:bg-black/90"}`}
              >
                <Save size={16} /> {isSaving ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
