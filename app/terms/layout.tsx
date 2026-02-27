import Footer from "@/app/components/footer";

type TermsLayoutProps = {
  children: React.ReactNode;
};

export default function TermsLayout({ children }: TermsLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
