export type UserRole = "student" | "instructor" | "admin";
export type CourseStatus = "draft" | "published";
export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type LessonType = "video" | "text" | "quiz";
export type TransactionStatus = "pending" | "completed" | "failed" | "paid_out";

export interface Profile {
  id: string;
  role: UserRole;
  onboarded: boolean;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  headline: string | null;
  website_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  stripe_account_id: string | null;
  stripe_account_ready: boolean;
  balance_available: number;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  instructor_id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  category: string;
  level: CourseLevel;
  price: number;
  status: CourseStatus;
  language: string;
  rating_average: number;
  rating_count: number;
  student_count: number;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: string;
  course_id: string;
  title: string;
  position: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  section_id: string;
  title: string;
  type: LessonType;
  content_url: string | null;
  content_text: string | null;
  attachment_url: string | null;
  duration_seconds: number;
  position: number;
  is_free_preview: boolean;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  lesson_id: string;
  question: string;
  options: string[];
  correct_option: number;
  position: number;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  purchased_at: string;
  amount_paid: number;
  stripe_checkout_session_id: string | null;
  progress_percent: number;
  completed_at: string | null;
}

export interface LessonProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  completed_at: string | null;
  last_position_seconds: number;
  updated_at: string;
}

export interface Review {
  id: string;
  student_id: string;
  course_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  student_id: string;
  course_id: string;
  issued_at: string;
  verification_code: string;
  pdf_url: string | null;
}

export interface Transaction {
  id: string;
  instructor_id: string;
  student_id: string | null;
  course_id: string | null;
  enrollment_id: string | null;
  amount: number;
  platform_fee: number;
  instructor_earnings: number;
  status: TransactionStatus;
  stripe_payment_intent_id: string | null;
  stripe_transfer_id: string | null;
  created_at: string;
}

/** Curso con relaciones habitualmente necesarias en la UI (catálogo, detalle). */
export interface CourseWithInstructor extends Course {
  instructor: Pick<Profile, "id" | "full_name" | "avatar_url" | "headline"> | null;
}

export interface SectionWithLessons extends Section {
  lessons: Lesson[];
}
