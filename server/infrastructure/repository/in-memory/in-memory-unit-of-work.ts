import type {
  Repositories,
  UnitOfWork,
} from "@/server/domain/common/unit-of-work";

export const createInMemoryUnitOfWork = (repos: Repositories): UnitOfWork => {
  return async <T>(operation: (repos: Repositories) => Promise<T>) =>
    operation(repos);
};
