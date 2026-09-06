import { PrismaChecklistItem, PrismaSChecklistItem, RosesChecklistItem } from "../types/slr";

const reportedItem = {
  status: "Reported" as const,
  locationInReview: "Manuscript workflow",
  userNotes: "",
};

export const INITIAL_PRISMA_CHECKLIST: PrismaChecklistItem[] = [
  {
    ...reportedItem,
    section: "TITLE",
    itemNumber: "1",
    topic: "Title",
    checklistDescription: "Identify the report as a systematic review.",
    appStageMapping: "Consolidated Manuscript",
  },
];

export const INITIAL_PRISMAS_CHECKLIST: PrismaSChecklistItem[] = [
  {
    ...reportedItem,
    domain: "INFORMATION_SOURCES",
    itemNumber: "1",
    topic: "Information sources",
    checklistDescription: "Report the sources represented in the review records.",
    appStageMapping: "Records & Deduplication",
  },
];

export const INITIAL_ROSES_CHECKLIST: RosesChecklistItem[] = [
  {
    ...reportedItem,
    section: "TITLE",
    itemNumber: "1",
    topic: "Title",
    checklistDescription: "Identify the report as a systematic review.",
    rosesEmphasis: "Evidence mapping",
    appStageMapping: "Consolidated Manuscript",
  },
];

export const initialPrismaChecklist = INITIAL_PRISMA_CHECKLIST;
export const initialPrismaSChecklist = INITIAL_PRISMAS_CHECKLIST;
export const initialRosesChecklist = INITIAL_ROSES_CHECKLIST;