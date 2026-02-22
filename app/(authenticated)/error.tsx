"use client";

import { useEffect } from "react";
import { ErrorContent } from "@/components/error-content";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Error caught by error boundary:", error);
  }, [error]);

  return <ErrorContent error={error} reset={reset} className="min-h-full" />;
}
