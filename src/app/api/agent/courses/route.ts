import { createClient } from "@/lib/supabase/server";
import { COURSE_WITH_INSTRUCTOR_SELECT } from "@/lib/queries/courses";
import { NextRequest, NextResponse } from "next/server";
import { validateAgentRequest } from "@/lib/utils/agentAuth";

export async function GET(request: NextRequest) {
  const authError = validateAgentRequest(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "12");

  const supabase = await createClient();

  let query = supabase
    .from("courses")
    .select(COURSE_WITH_INSTRUCTOR_SELECT, { count: "exact" })
    .eq("status", "published")
    .order("student_count", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    courses: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
}