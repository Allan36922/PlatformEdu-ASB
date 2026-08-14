import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EdyWidgetLauncher } from "@/components/layout/edy-widget-launcher";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <EdyWidgetLauncher />
    </div>
  );
}
