import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "portfolio.db");
const db = new Database(dbPath);

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    year TEXT,
    type TEXT,
    role TEXT,
    summary TEXT,
    featured INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    home_order INTEGER DEFAULT 0,
    thumbnail_url TEXT,
    tech_camera TEXT,
    tech_lens TEXT,
    tech_lighting TEXT,
    tech_color TEXT,
    link TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS project_videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    title TEXT,
    description TEXT,
    youtube_url TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    name TEXT,
    note TEXT
  );
`);

// Migration: Rename columns if they are in the old format
try {
  const projectCols = db.prepare("PRAGMA table_info(projects)").all() as any[];
  if (projectCols.some(c => c.name === "thumbnailUrl") && !projectCols.some(c => c.name === "thumbnail_url")) {
    db.exec("ALTER TABLE projects RENAME COLUMN thumbnailUrl TO thumbnail_url");
    console.log("Migrated projects table: thumbnailUrl -> thumbnail_url");
  }

  const videoCols = db.prepare("PRAGMA table_info(project_videos)").all() as any[];
  if (videoCols.some(c => c.name === "youtubeUrl") && !videoCols.some(c => c.name === "youtube_url")) {
    db.exec("ALTER TABLE project_videos RENAME COLUMN youtubeUrl TO youtube_url");
    console.log("Migrated project_videos table: youtubeUrl -> youtube_url");
  }

  // Add missing columns if they don't exist
  if (!projectCols.some(c => c.name === "link")) {
    db.exec("ALTER TABLE projects ADD COLUMN link TEXT");
  }
  if (!projectCols.some(c => c.name === "description")) {
    db.exec("ALTER TABLE projects ADD COLUMN description TEXT");
  }
  if (!projectCols.some(c => c.name === "created_at")) {
    db.exec("ALTER TABLE projects ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
  }
  if (!projectCols.some(c => c.name === "updated_at")) {
    db.exec("ALTER TABLE projects ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
  }
  if (!projectCols.some(c => c.name === "sort_order")) {
    db.exec("ALTER TABLE projects ADD COLUMN sort_order INTEGER DEFAULT 0");
  }
  if (!projectCols.some(c => c.name === "home_order")) {
    db.exec("ALTER TABLE projects ADD COLUMN home_order INTEGER DEFAULT 0");
  }
} catch (e) {
  console.error("Migration failed:", e);
}

// Helper to get/set settings
const getSetting = (key: string, defaultValue: any) => {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row ? JSON.parse(row.value) : defaultValue;
};

const setSetting = (key: string, value: any) => {
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, JSON.stringify(value));
};

// Initial Data if empty
const initHome = () => {
  if (!db.prepare("SELECT key FROM settings WHERE key = 'home_name'").get()) {
    setSetting("home_name", "홍길동");
    setSetting("home_role", "촬영감독 (Cinematographer)");
    setSetting("home_tagline", "빛과 구도로 이야기의 깊이를 더하는 촬영감독 홍길동입니다.");
    setSetting("home_resumeUrl", "");
    setSetting("home_featuredProjectIds", []);
  }
};

const initAbout = () => {
  if (!db.prepare("SELECT key FROM settings WHERE key = 'about_introText'").get()) {
    setSetting("about_profileImageUrl", "https://picsum.photos/seed/profile/400/500");
    setSetting("about_introText", "안녕하세요. 현장의 공기를 담아내는 촬영감독입니다. 다수의 단편영화와 광고 작업을 통해 탄탄한 기본기를 쌓아왔습니다.");
    setSetting("about_services", "디지털 시네마토그래피\n조명 설계 및 운용\nDaVinci Resolve 색보정");
    setSetting("about_experience", "2023 - 현재: 프리랜서 촬영감독\n2021 - 2023: AA 프로덕션 촬영팀\n2020: 한국예술종합학교 영상원 졸업");
  }
};

const initContact = () => {
  if (!db.prepare("SELECT key FROM settings WHERE key = 'contact_email'").get()) {
    setSetting("contact_email", "director@example.com");
    setSetting("contact_instagramUrl", "https://instagram.com");
    setSetting("contact_instagramText", "@cinematographer");
    setSetting("contact_phone", "010-1234-5678");
    setSetting("contact_resumeUrl", "");
  }
};

initHome();
initAbout();
initContact();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/content", (req, res) => {
    const { key } = req.query;
    if (key) {
      res.json(getSetting(key as string, {}));
    } else {
      const all = db.prepare("SELECT * FROM settings").all() as any[];
      const result = all.reduce((acc, curr) => {
        acc[curr.key] = JSON.parse(curr.value);
        return acc;
      }, {});
      res.json(result);
    }
  });

  app.post("/api/content", (req, res) => {
    try {
      const body = req.body;
      const transaction = db.transaction((data) => {
        if (data.key && data.value !== undefined) {
          setSetting(data.key, data.value);
        } else {
          for (const [key, value] of Object.entries(data)) {
            setSetting(key, value);
          }
        }
      });
      transaction(body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving content:", error);
      res.status(500).json({ 
        error: "Failed to save content", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.post("/api/upload", (req, res) => {
    // For local dev, we just return the base64 as the URL or save to a local folder.
    // To keep it simple, we'll just return the base64 data URL.
    res.json({ url: req.body.image });
  });

  app.get("/api/home", (req, res) => res.json(getSetting("home", {
    name: "", role: "", tagline: "", resumeUrl: "", featuredProjectIds: []
  })));
  app.post("/api/home", (req, res) => {
    setSetting("home", req.body);
    res.json({ success: true });
  });

  app.get("/api/about", (req, res) => res.json(getSetting("about", {
    profileImageUrl: "", introText: "", capabilities: [], careers: []
  })));
  app.post("/api/about", (req, res) => {
    setSetting("about", req.body);
    res.json({ success: true });
  });

  app.get("/api/contact", (req, res) => res.json(getSetting("contact", {
    email: "", instagramUrl: "", instagramText: "", phone: "", resumeUrl: ""
  })));
  app.post("/api/contact", (req, res) => {
    setSetting("contact", req.body);
    res.json({ success: true });
  });

  // Projects
  app.get("/api/projects", (req, res) => {
    const { id } = req.query;
    if (id) {
      const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as any;
      if (project) {
        project.thumbnailUrl = project.thumbnail_url;
        project.tech = {
          camera: project.tech_camera,
          lens: project.tech_lens,
          lighting: project.tech_lighting,
          color: project.tech_color
        };
        project.videos = db.prepare("SELECT * FROM project_videos WHERE project_id = ?").all(id).map((v: any) => ({
          ...v,
          youtubeUrl: v.youtube_url
        }));
        res.json(project);
      } else {
        res.status(404).json({ error: "Not found" });
      }
      return;
    }
    // Ensure consistent sorting: sort_order ASC, nulls last
    const projects = db.prepare("SELECT * FROM projects WHERE title IS NOT NULL AND title != '' ORDER BY CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END, sort_order ASC, id DESC").all() as any[];
    const transformed = projects.map(p => ({
      ...p,
      thumbnailUrl: p.thumbnail_url,
      tech: {
        camera: p.tech_camera,
        lens: p.tech_lens,
        lighting: p.tech_lighting,
        color: p.tech_color
      }
    }));
    res.json(transformed);
  });

  app.get("/api/projects/:id", (req, res) => {
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id) as any;
    if (project) {
      project.thumbnailUrl = project.thumbnail_url;
      project.tech = {
        camera: project.tech_camera,
        lens: project.tech_lens,
        lighting: project.tech_lighting,
        color: project.tech_color
      };
      project.videos = db.prepare("SELECT * FROM project_videos WHERE project_id = ?").all(req.params.id).map((v: any) => ({
        ...v,
        youtubeUrl: v.youtube_url
      }));
      res.json(project);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.post("/api/projects", (req, res) => {
    try {
      const body = req.body;
      
      // Defensive logic: Prevent empty project creation
      const title = body.title?.trim() || "";
      const description = body.description?.trim() || "";
      const thumbnail_url = (body.thumbnailUrl || body.thumbnail_url || "").trim();

      // Reject if title is empty OR if all core fields are empty
      if (!title) {
        return res.status(400).json({ error: "Project title is required" });
      }
      
      if (!title && !description && !thumbnail_url) {
        return res.status(400).json({ error: "Cannot create an empty project row. Title, description, or thumbnail is required." });
      }

      const row = {
        title: title,
        year: body.year ?? null,
        type: body.type ?? null,
        role: body.role ?? null,
        summary: body.summary ?? null,
        featured: body.featured ? 1 : 0,
        thumbnail_url: thumbnail_url || null,
        tech_camera: body.techCamera ?? body.tech?.camera ?? body.tech_camera ?? null,
        tech_lens: body.techLens ?? body.tech?.lens ?? body.tech_lens ?? null,
        tech_lighting: body.techLighting ?? body.tech?.lighting ?? body.tech_lighting ?? null,
        tech_color: body.techColor ?? body.tech?.color ?? body.tech_color ?? null,
        link: body.link ?? null,
        description: description || null,
        sort_order: body.sort_order ?? 0,
        home_order: body.home_order ?? 0,
        updated_at: new Date().toISOString()
      };

      const info = db.prepare(`
        INSERT INTO projects (
          title, year, type, role, summary, featured, thumbnail_url, 
          tech_camera, tech_lens, tech_lighting, tech_color, 
          link, description, sort_order, home_order, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        row.title, row.year, row.type, row.role, row.summary, row.featured, row.thumbnail_url,
        row.tech_camera, row.tech_lens, row.tech_lighting, row.tech_color,
        row.link, row.description, row.sort_order, row.home_order, row.updated_at
      );
      
      const projectId = info.lastInsertRowid;
      if (body.videos && Array.isArray(body.videos)) {
        const stmt = db.prepare("INSERT INTO project_videos (project_id, title, description, youtube_url) VALUES (?, ?, ?, ?)");
        for (const v of body.videos) {
          if (v.youtubeUrl || v.youtube_url) {
            stmt.run(projectId, v.title || "", v.description || "", v.youtubeUrl ?? v.youtube_url);
          }
        }
      }
      res.json({ id: projectId });
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ error: "Failed to create project", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/projects", (req, res) => {
    try {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "Missing project id" });
      
      const body = req.body;
      
      // Defensive logic: Prevent empty project update
      const title = body.title?.trim() || "";
      const description = body.description?.trim() || "";
      const thumbnail_url = (body.thumbnailUrl || body.thumbnail_url || "").trim();

      if (!title && !description && !thumbnail_url) {
        return res.status(400).json({ error: "Cannot update to an empty project row. Title, description, or thumbnail is required." });
      }

      const row = {
        title: title,
        year: body.year ?? null,
        type: body.type ?? null,
        role: body.role ?? null,
        summary: body.summary ?? null,
        featured: body.featured ? 1 : 0,
        thumbnail_url: thumbnail_url || null,
        tech_camera: body.techCamera ?? body.tech?.camera ?? body.tech_camera ?? null,
        tech_lens: body.techLens ?? body.tech?.lens ?? body.tech_lens ?? null,
        tech_lighting: body.techLighting ?? body.tech?.lighting ?? body.tech_lighting ?? null,
        tech_color: body.techColor ?? body.tech?.color ?? body.tech_color ?? null,
        link: body.link ?? null,
        description: description || null,
        sort_order: body.sort_order !== undefined ? body.sort_order : 0,
        home_order: body.home_order !== undefined ? body.home_order : 0,
        updated_at: new Date().toISOString()
      };

      const result = db.prepare(`
        UPDATE projects SET 
          title = ?, year = ?, type = ?, role = ?, summary = ?, featured = ?, thumbnail_url = ?,
          tech_camera = ?, tech_lens = ?, tech_lighting = ?, tech_color = ?,
          link = ?, description = ?, sort_order = ?, home_order = ?, updated_at = ?
        WHERE id = ?
      `).run(
        row.title, row.year, row.type, row.role, row.summary, row.featured, row.thumbnail_url,
        row.tech_camera, row.tech_lens, row.tech_lighting, row.tech_color,
        row.link, row.description, row.sort_order, row.home_order, row.updated_at,
        id
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: "Project not found for update" });
      }

      db.prepare("DELETE FROM project_videos WHERE project_id = ?").run(id);
      if (body.videos && Array.isArray(body.videos)) {
        const stmt = db.prepare("INSERT INTO project_videos (project_id, title, description, youtube_url) VALUES (?, ?, ?, ?)");
        for (const v of body.videos) {
          if (v.youtubeUrl || v.youtube_url) {
            stmt.run(id, v.title || "", v.description || "", v.youtubeUrl ?? v.youtube_url);
          }
        }
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ error: "Failed to update project", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/projects", (req, res) => {
    try {
      const id = req.query.id;
      db.prepare("DELETE FROM projects WHERE id = ?").run(id);
      db.prepare("DELETE FROM project_videos WHERE project_id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  app.put("/api/projects/:id", (req, res) => {
    try {
      const id = req.params.id || req.query.id;
      if (!id) return res.status(400).json({ error: "Missing project id" });

      const body = req.body;
      
      // Defensive logic: Prevent empty project update
      const title = body.title?.trim() || "";
      const description = body.description?.trim() || "";
      const thumbnail_url = (body.thumbnailUrl || body.thumbnail_url || "").trim();

      if (!title && !description && !thumbnail_url) {
        return res.status(400).json({ error: "Cannot update to an empty project row. Title, description, or thumbnail is required." });
      }

      const row = {
        title: title,
        year: body.year ?? null,
        type: body.type ?? null,
        role: body.role ?? null,
        summary: body.summary ?? null,
        featured: body.featured ? 1 : 0,
        thumbnail_url: thumbnail_url || null,
        tech_camera: body.techCamera ?? body.tech?.camera ?? body.tech_camera ?? null,
        tech_lens: body.techLens ?? body.tech?.lens ?? body.tech_lens ?? null,
        tech_lighting: body.techLighting ?? body.tech?.lighting ?? body.tech_lighting ?? null,
        tech_color: body.techColor ?? body.tech?.color ?? body.tech_color ?? null,
        link: body.link ?? null,
        description: description || null,
        sort_order: body.sort_order !== undefined ? body.sort_order : 0,
        home_order: body.home_order !== undefined ? body.home_order : 0,
        updated_at: new Date().toISOString()
      };

      const result = db.prepare(`
        UPDATE projects SET 
          title = ?, year = ?, type = ?, role = ?, summary = ?, featured = ?, thumbnail_url = ?,
          tech_camera = ?, tech_lens = ?, tech_lighting = ?, tech_color = ?,
          link = ?, description = ?, sort_order = ?, home_order = ?, updated_at = ?
        WHERE id = ?
      `).run(
        row.title, row.year, row.type, row.role, row.summary, row.featured, row.thumbnail_url,
        row.tech_camera, row.tech_lens, row.tech_lighting, row.tech_color,
        row.link, row.description, row.sort_order, row.home_order, row.updated_at,
        id
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: "Project not found for update" });
      }

      db.prepare("DELETE FROM project_videos WHERE project_id = ?").run(id);
      if (body.videos && Array.isArray(body.videos)) {
        const stmt = db.prepare("INSERT INTO project_videos (project_id, title, description, youtube_url) VALUES (?, ?, ?, ?)");
        for (const v of body.videos) {
          if (v.youtubeUrl || v.youtube_url) {
            stmt.run(id, v.title || "", v.description || "", v.youtubeUrl ?? v.youtube_url);
          }
        }
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ error: "Failed to update project", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/projects/:id", (req, res) => {
    const id = req.params.id || req.query.id;
    db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    db.prepare("DELETE FROM project_videos WHERE project_id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/projects/reorder", (req, res) => {
    try {
      const orders = req.body; // Array of { id: number, sort_order: number }
      
      console.log("reorder only called");
      console.log("/api/projects/reorder payload", JSON.stringify(orders));

      if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(400).json({ error: "Invalid orders format. Expected a non-empty array." });
      }

      // Strict check: only id and sort_order allowed
      for (const item of orders) {
        const keys = Object.keys(item);
        if (!item.id || item.sort_order === undefined) {
          return res.status(400).json({ error: "Each item must have an id and sort_order." });
        }
        if (keys.length > 2) {
          return res.status(400).json({ error: "Reorder payload must only contain id and sort_order." });
        }
      }

      const updateStmt = db.prepare("UPDATE projects SET sort_order = ? WHERE id = ?");
      const transaction = db.transaction((items) => {
        for (const item of items) {
          updateStmt.run(item.sort_order, item.id);
        }
      });

      transaction(orders);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering projects:", error);
      res.status(500).json({ 
        error: "Failed to reorder projects", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.post("/api/projects/reorder-home", (req, res) => {
    try {
      const orders = req.body; // Array of { id: number, home_order: number }
      
      console.log("reorder home only called");
      console.log("/api/projects/reorder-home payload", JSON.stringify(orders));

      if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(400).json({ error: "Invalid orders format. Expected a non-empty array." });
      }

      // Strict check: only id and home_order allowed
      for (const item of orders) {
        const keys = Object.keys(item);
        if (!item.id || item.home_order === undefined) {
          return res.status(400).json({ error: "Each item must have an id and home_order." });
        }
        if (keys.length > 2) {
          return res.status(400).json({ error: "Reorder payload must only contain id and home_order." });
        }
      }

      const updateStmt = db.prepare("UPDATE projects SET home_order = ? WHERE id = ?");
      const transaction = db.transaction((items) => {
        for (const item of items) {
          updateStmt.run(item.home_order, item.id);
        }
      });

      transaction(orders);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering home projects:", error);
      res.status(500).json({ 
        error: "Failed to reorder home projects", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Equipment
  app.get("/api/equipment", (req, res) => {
    const { id } = req.query;
    if (id) {
      const item = db.prepare("SELECT * FROM equipment WHERE id = ?").get(id);
      res.json(item);
      return;
    }
    const items = db.prepare("SELECT * FROM equipment").all();
    res.json(items);
  });

  app.post("/api/equipment", (req, res) => {
    const { category, name, note } = req.body;
    const info = db.prepare("INSERT INTO equipment (category, name, note) VALUES (?, ?, ?)").run(category ?? null, name ?? null, note ?? null);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/equipment", (req, res) => {
    const id = req.query.id;
    const { category, name, note } = req.body;
    db.prepare("UPDATE equipment SET category = ?, name = ?, note = ? WHERE id = ?").run(category ?? null, name ?? null, note ?? null, id);
    res.json({ success: true });
  });

  app.delete("/api/equipment", (req, res) => {
    const id = req.query.id;
    db.prepare("DELETE FROM equipment WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.put("/api/equipment/:id", (req, res) => {
    const id = req.params.id || req.query.id;
    const { category, name, note } = req.body;
    db.prepare("UPDATE equipment SET category = ?, name = ?, note = ? WHERE id = ?").run(category ?? null, name ?? null, note ?? null, id);
    res.json({ success: true });
  });

  app.delete("/api/equipment/:id", (req, res) => {
    const id = req.params.id || req.query.id;
    db.prepare("DELETE FROM equipment WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
