"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createCheckoutSessionAction } from "@/lib/actions/checkout";

export function CheckoutButton({ courseId }: { courseId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        size="lg"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await createCheckoutSessionAction(courseId);
            if (result?.error) setError(result.error);
          })
        }
      >
        {pending ? "Redirigiendo a Stripe..." : "Pagar con Stripe"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
