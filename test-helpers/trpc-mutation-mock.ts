import { vi } from "vitest";

export type MutationBehavior = "idle" | "success" | "error" | "pending";

type MakeMutationMockOptions = {
  errorMessage?: string | null;
  hasReset?: boolean;
  successData?: unknown;
};

export function makeMutationMock<TData = void>(
  getBehavior: () => MutationBehavior,
  options?: MakeMutationMockOptions,
) {
  const errorMessage = options?.errorMessage ?? null;
  const hasReset = options?.hasReset ?? true;
  const successData = options?.successData;

  const mutateSpyRef = { current: vi.fn() };
  const resetSpy = vi.fn();

  const useMutation = (mutationOptions?: {
    onSuccess?: (data: TData) => void;
    onError?: () => void;
  }) => {
    const behavior = getBehavior();
    mutateSpyRef.current = vi.fn(() => {
      if (behavior === "success") {
        mutationOptions?.onSuccess?.(successData as TData);
      } else if (behavior === "error") {
        mutationOptions?.onError?.();
      }
    });
    return {
      mutate: mutateSpyRef.current,
      ...(hasReset ? { reset: resetSpy } : {}),
      isPending: behavior === "pending",
      data: null,
      error:
        behavior === "error" && errorMessage != null
          ? { message: errorMessage }
          : null,
    };
  };

  return { useMutation, mutateSpyRef, resetSpy };
}
