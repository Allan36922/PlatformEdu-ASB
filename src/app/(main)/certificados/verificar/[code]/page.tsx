import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { getCertificateByCode } from "@/lib/queries/certificates";

export const metadata: Metadata = { title: "Verificar certificado" };

interface VerifyPageProps {
  params: Promise<{ code: string }>;
}

export default async function VerifyCertificatePage({ params }: VerifyPageProps) {
  const { code } = await params;
  const certificate = await getCertificateByCode(code);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      {certificate ? (
        <>
          <CheckCircle2 className="mx-auto mb-4 size-14 text-emerald-500" />
          <h1 className="text-2xl font-bold">Certificado válido</h1>
          <div className="mt-6 space-y-2 rounded-lg border p-6 text-left text-sm">
            <p>
              <span className="text-muted-foreground">Estudiante: </span>
              <strong>{certificate.student?.full_name}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">Curso: </span>
              <strong>{certificate.course?.title}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">Instructor: </span>
              {certificate.course?.instructor?.full_name}
            </p>
            <p>
              <span className="text-muted-foreground">Fecha de emisión: </span>
              {new Date(certificate.issued_at).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p>
              <span className="text-muted-foreground">Código: </span>
              <code>{certificate.verification_code}</code>
            </p>
          </div>
        </>
      ) : (
        <>
          <XCircle className="mx-auto mb-4 size-14 text-destructive" />
          <h1 className="text-2xl font-bold">Certificado no encontrado</h1>
          <p className="mt-2 text-muted-foreground">
            El código ingresado no corresponde a ningún certificado emitido.
          </p>
        </>
      )}
    </div>
  );
}
