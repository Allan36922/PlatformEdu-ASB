import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { CheckoutButton } from "@/components/checkout/checkout-button";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Confirmar compra" };

interface CheckoutPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { courseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/checkout/${courseId}`);

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, price, thumbnail_url, short_description, status")
    .eq("id", courseId)
    .single();

  if (!course || course.status !== "published") notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">Confirmar compra</h1>
      <div className="space-y-4 rounded-xl border p-6 shadow-sm">
        <div className="flex gap-4">
          <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-md bg-muted">
            {course.thumbnail_url && (
              <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover" />
            )}
          </div>
          <div>
            <p className="font-medium">{course.title}</p>
            <p className="text-sm text-muted-foreground">{course.short_description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-muted-foreground">Total</span>
          <span className="text-xl font-bold">{formatCurrency(course.price)}</span>
        </div>
        <CheckoutButton courseId={course.id} />
        <p className="text-center text-xs text-muted-foreground">Pago seguro procesado por Stripe</p>
      </div>
    </div>
  );
}
