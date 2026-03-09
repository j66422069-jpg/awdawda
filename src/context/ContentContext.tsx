import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface ContentContextType {
  content: any;
  projects: any[];
  equipment: any[];
  projectDetails: Record<string, any>;
  loading: boolean;
  projectsLoaded: boolean;
  equipmentLoaded: boolean;
  fetchContent: (force?: boolean) => Promise<void>;
  fetchProjects: (force?: boolean) => Promise<void>;
  fetchEquipment: (force?: boolean) => Promise<void>;
  fetchProjectDetail: (id: string, force?: boolean) => Promise<any>;
  updateContent: (newContent: any) => void;
  updateProjects: (newProjects: any[]) => void;
  updateEquipment: (newEquipment: any[]) => void;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [projectDetails, setProjectDetails] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [equipmentLoaded, setEquipmentLoaded] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchingProjects, setFetchingProjects] = useState(false);
  const [fetchingEquipment, setFetchingEquipment] = useState(false);

  const fetchContent = useCallback(async (force = false) => {
    if (!force && (content || fetching)) return;
    
    setFetching(true);
    try {
      const res = await fetch("/api/content");
      if (res.ok) {
        const data = await res.json();
        setContent(data);
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [content, fetching]);

  const fetchProjects = useCallback(async (force = false) => {
    if (!force && (projectsLoaded || fetchingProjects)) return;
    
    setFetchingProjects(true);
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProjects(data);
          setProjectsLoaded(true);
          if (force) setProjectDetails({});
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setFetchingProjects(false);
    }
  }, [projectsLoaded, fetchingProjects]);

  const fetchEquipment = useCallback(async (force = false) => {
    if (!force && (equipmentLoaded || fetchingEquipment)) return;
    
    setFetchingEquipment(true);
    try {
      const res = await fetch("/api/equipment");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEquipment(data);
          setEquipmentLoaded(true);
        }
      }
    } catch (error) {
      console.error("Failed to fetch equipment:", error);
    } finally {
      setFetchingEquipment(false);
    }
  }, [equipmentLoaded, fetchingEquipment]);

  const fetchProjectDetail = useCallback(async (id: string, force = false) => {
    if (!force && projectDetails[id]) return projectDetails[id];
    
    try {
      const res = await fetch(`/api/projects?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setProjectDetails(prev => ({ ...prev, [id]: data }));
        return data;
      }
    } catch (error) {
      console.error(`Failed to fetch project detail ${id}:`, error);
    }
    return null;
  }, [projectDetails]);

  const updateContent = useCallback((newContent: any) => {
    setContent(prev => ({ ...prev, ...newContent }));
  }, []);

  const updateProjects = useCallback((newProjects: any[]) => {
    setProjects(newProjects);
    setProjectDetails({}); // Clear details cache when projects change
  }, []);

  const updateEquipment = useCallback((newEquipment: any[]) => {
    setEquipment(newEquipment);
  }, []);

  useEffect(() => {
    fetchContent();
    fetchProjects();
    fetchEquipment();
  }, [fetchContent, fetchProjects, fetchEquipment]);

  return (
    <ContentContext.Provider value={{ 
      content, 
      projects, 
      equipment, 
      projectDetails,
      loading, 
      projectsLoaded,
      equipmentLoaded,
      fetchContent, 
      fetchProjects, 
      fetchEquipment,
      fetchProjectDetail,
      updateContent,
      updateProjects,
      updateEquipment
    }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error("useContent must be used within a ContentProvider");
  }
  return context;
};
