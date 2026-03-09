import { HashRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, ChevronRight, ExternalLink, Mail, Instagram, Phone, Download, Copy, Check, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ContentProvider } from "./context/ContentContext";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import ProjectList from "./pages/ProjectList";
import ProjectDetail from "./pages/ProjectDetail";
import Equipment from "./pages/Equipment";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "HOME", path: "/" },
    { name: "ABOUT", path: "/about" },
    { name: "PROJECT", path: "/projects" },
    { name: "EQUIPMENT", path: "/equipment" },
    { name: "CONTACT", path: "/contact" },
    { name: "ADMIN", path: "/admin" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tighter">
          PORTFOLIO
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "text-xs font-medium tracking-widest transition-colors hover:text-black flex items-center",
                location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path))
                  ? "text-black"
                  : "text-black/40"
              )}
            >
              {item.name === "ADMIN" ? <Settings size={14} /> : item.name}
            </Link>
          ))}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-black/5 px-6 py-8 flex flex-col space-y-6"
          >
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "text-sm font-medium tracking-widest flex items-center",
                  location.pathname === item.path ? "text-black" : "text-black/40"
                )}
              >
                {item.name === "ADMIN" ? <Settings size={18} /> : item.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default function App() {
  return (
    <Router>
      <ContentProvider>
        <div className="min-h-screen bg-[#F9F9F9] text-black font-sans selection:bg-black selection:text-white">
          <Navbar />
          <main className="pt-16 min-h-screen">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/projects" element={<ProjectList />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/equipment" element={<Equipment />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
          <footer className="py-12 px-6 border-t border-black/5 text-center">
            <p className="text-[10px] tracking-widest text-black/30 uppercase">
              © {new Date().getFullYear()} Cinematographer Portfolio. All Rights Reserved.
            </p>
          </footer>
        </div>
      </ContentProvider>
    </Router>
  );
}
