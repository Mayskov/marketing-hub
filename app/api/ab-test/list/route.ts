import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: tests, error } = await supabaseAdmin
      .from("ab_tests")
      .select("id, name, status, description, campaign_id, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ tests: tests || [] });
  } catch (error) {
    console.error("AB test list error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка загрузки тестов" },
      { status: 500 }
    );
  }
}
