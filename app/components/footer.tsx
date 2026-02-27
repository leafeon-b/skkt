import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-muted p-3 text-center text-sm text-gray-600">
      <Link href="/terms" className="hover:underline">
        利用規約
      </Link>
      <span className="mx-2" aria-hidden="true">
        |
      </span>
      <Link href="/privacy" className="hover:underline">
        プライバシーポリシー
      </Link>
      <span className="mx-2" aria-hidden="true">
        |
      </span>
      Copyright &copy; {new Date().getFullYear()} SKKT. All rights reserved.
    </footer>
  );
}
