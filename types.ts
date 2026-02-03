/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// Nosology types
export interface LessonStep {
  number: number;
  text: string;
  duration: number | null;
}

export interface LessonSection {
  title: string;
  icon: string;
  items: string[];
  isWarning?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  goal: string;
  duration: number;
  videoUrl: string | null;
  steps: LessonStep[];
  methodology: LessonSection;
  errors: LessonSection;
}

export interface Nosology {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  isFree: boolean;
  duration: string;
  lessonCount: number;
  warning?: string;
  lessons: Lesson[];
}

export type NosologyMap = Record<string, Nosology>;
