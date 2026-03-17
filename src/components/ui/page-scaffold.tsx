"use client";

import { motion } from "framer-motion";

import { GlassPanel } from "@/components/ui/glass-panel";

type ScaffoldZone = {
  title: string;
  description: string;
};

type PageScaffoldProps = {
  eyebrow: string;
  description: string;
  zones: ScaffoldZone[];
};

export function PageScaffold({ eyebrow, description, zones }: PageScaffoldProps) {
  return (
    <section className="space-y-6">
      <GlassPanel className="p-6 mobile:p-8">
        <p className="font-body text-[10px] uppercase tracking-[0.24em] text-app-muted">{eyebrow}</p>
        <p className="mt-4 max-w-3xl font-body text-sm leading-relaxed text-app-secondary">{description}</p>
      </GlassPanel>

      <div className="grid gap-4 compact:grid-cols-2">
        {zones.map((zone, index) => (
          <motion.article
            key={zone.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.32, ease: "easeOut" }}
            className="rounded-soft border border-app-border-light bg-app-card p-5"
          >
            <p className="font-body text-[10px] uppercase tracking-[0.18em] text-app-muted">
              Блок {String(index + 1).padStart(2, "0")}
            </p>
            <h2 className="mt-2 font-display text-2xl text-app-primary">{zone.title}</h2>
            <p className="mt-2 font-body text-sm leading-relaxed text-app-secondary">{zone.description}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
