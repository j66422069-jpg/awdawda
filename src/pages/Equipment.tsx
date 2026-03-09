import { useEffect } from "react";
import { motion } from "motion/react";
import { Camera, Layers, Sun, Palette } from "lucide-react";
import { useContent } from "../context/ContentContext";

export default function Equipment() {
  const { content, equipment: items, fetchEquipment, equipmentLoaded } = useContent();

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const categories = ["Camera", "Lens", "Lighting", "Color"] as const;

  const getIcon = (cat: string) => {
    switch (cat) {
      case "Camera": return <Camera size={18} />;
      case "Lens": return <Layers size={18} />;
      case "Lighting": return <Sun size={18} />;
      case "Color": return <Palette size={18} />;
      default: return null;
    }
  };

  if (!equipmentLoaded && items.length === 0) return <div className="max-w-7xl mx-auto px-6 py-20 text-black/20 font-bold tracking-widest uppercase">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-20">
          <h2 className="text-xs font-bold tracking-[0.3em] text-black/40 uppercase mb-4">
            Equipment & Capability
          </h2>
          <h1 className="text-4xl font-bold tracking-tight mb-8">운용 장비 및 역량</h1>
          <p className="text-lg text-black/60 max-w-2xl leading-relaxed whitespace-pre-line">
            {content?.equipment_description || "단순한 장비 보유가 아닌, 각 장비의 특성을 이해하고 현장의 상황에 맞춰 최적의 결과물을 만들어내는 운용 역량에 집중합니다."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {categories.map((cat) => {
            const catItems = items.filter(i => i.category === cat);
            return (
              <div key={cat} className="space-y-8">
                <div className="flex items-center gap-3 pb-4 border-b border-black/10">
                  <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-full">
                    {getIcon(cat)}
                  </div>
                  <h3 className="text-xl font-bold tracking-tight uppercase">{cat}</h3>
                </div>
                
                <div className="space-y-6">
                  {catItems.length > 0 ? (
                    catItems.map((item) => (
                      <div key={item.id} className="group">
                        <h4 className="text-lg font-bold tracking-tight mb-2 group-hover:text-black/60 transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-sm text-black/50 leading-relaxed italic">
                          "{item.note}"
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-black/20 italic">등록된 장비가 없습니다.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
