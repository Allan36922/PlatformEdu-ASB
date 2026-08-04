import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Helvetica",
  },
  border: {
    position: "absolute",
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    border: "2pt solid #4338CA",
  },
  eyebrow: {
    fontSize: 12,
    color: "#6B7280",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 28,
  },
  studentName: {
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 18,
    textAlign: "center",
  },
  text: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    marginBottom: 6,
  },
  courseTitle: {
    fontSize: 22,
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 28,
    textAlign: "center",
  },
  footer: {
    marginTop: 48,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
  },
  small: {
    fontSize: 10,
    color: "#9CA3AF",
  },
});

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  instructorName: string;
  issuedAt: string;
  verificationCode: string;
}

function CertificateDocument({
  studentName,
  courseTitle,
  instructorName,
  issuedAt,
  verificationCode,
}: CertificateData) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border} fixed />
        <Text style={styles.eyebrow}>Certificado de finalización</Text>
        <Text style={styles.text}>Se otorga el presente certificado a</Text>
        <Text style={styles.studentName}>{studentName}</Text>
        <Text style={styles.text}>por completar exitosamente el curso</Text>
        <Text style={styles.courseTitle}>{courseTitle}</Text>
        <Text style={styles.text}>Instructor: {instructorName}</Text>
        <View style={styles.footer}>
          <Text style={styles.small}>Fecha de emisión: {issuedAt}</Text>
          <Text style={styles.small}>Código de verificación: {verificationCode}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderCertificatePdf(data: CertificateData): Promise<Buffer> {
  return renderToBuffer(<CertificateDocument {...data} />);
}
