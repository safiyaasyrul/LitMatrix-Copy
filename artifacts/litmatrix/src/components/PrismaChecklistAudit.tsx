import React from "react";
import {
  PrismaChecklistItem,
  PrismaSChecklistItem,
  RosesChecklistItem,
} from "../types/slr";

interface PrismaChecklistAuditProps {
  checklist: PrismaChecklistItem[];
  onUpdateItem: (itemNumber: string, updates: Partial<PrismaChecklistItem>) => void;
  prismaSChecklist: PrismaSChecklistItem[];
  onUpdatePrismaSItem: (itemNumber: string, updates: Partial<PrismaSChecklistItem>) => void;
  rosesChecklist: RosesChecklistItem[];
  onUpdateRosesItem: (itemNumber: string, updates: Partial<RosesChecklistItem>) => void;
  onNavigateStage: (stage: number) => void;
}

export default function PrismaChecklistAudit({
  checklist,
  onUpdateItem,
  prismaSChecklist,
  onUpdatePrismaSItem,
  rosesChecklist,
  onUpdateRosesItem,
  onNavigateStage,
}: PrismaChecklistAuditProps) {
  const cycleStatus = (
    current: "Reported" | "Partially reported" | "Not reported" | "Not applicable",
  ) => {
    const statuses = ["Reported", "Partially reported", "Not reported", "Not applicable"] as const;
    return statuses[(statuses.indexOf(current) + 1) % statuses.length];
  };

  return (
    <section className="max-w-5xl mx-auto space-y-6">
      <header>
        <p className="text-xs font-mono uppercase tracking-wider text-indigo-600">PRISMA reporting audit</p>
        <h1 className="text-2xl font-bold text-slate-900">Checklist Audit</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review the reporting checklist before moving through the evidence workflow.
        </p>
      </header>
      <div className="space-y-3">
        {checklist.map((item) => (
          <button
            key={`prisma-${item.itemNumber}`}
            type="button"
            onClick={() => onUpdateItem(item.itemNumber, { status: cycleStatus(item.status) })}
            className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-indigo-300"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-slate-900">
                {item.itemNumber}. {item.topic}
              </span>
              <span className="text-xs font-mono text-indigo-700">{item.status}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{item.checklistDescription}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          PRISMA-S items: {prismaSChecklist.length}
          <button
            type="button"
            className="ml-2 text-indigo-700 underline"
            onClick={() => {
              const item = prismaSChecklist[0];
              if (item) onUpdatePrismaSItem(item.itemNumber, { status: cycleStatus(item.status) });
            }}
          >
            cycle first
          </button>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          ROSES items: {rosesChecklist.length}
          <button
            type="button"
            className="ml-2 text-indigo-700 underline"
            onClick={() => {
              const item = rosesChecklist[0];
              if (item) onUpdateRosesItem(item.itemNumber, { status: cycleStatus(item.status) });
            }}
          >
            cycle first
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onNavigateStage(2)}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Continue to protocol
      </button>
    </section>
  );
}