import Footer from "@/app/components/footer";

type PrivacyLayoutProps = {
  children: React.ReactNode;
};

export default function PrivacyLayout({ children }: PrivacyLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
