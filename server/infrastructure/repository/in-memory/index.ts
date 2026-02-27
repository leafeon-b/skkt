import type { Repositories } from "@/server/application/common/unit-of-work";
import type { CircleInviteLinkRepository } from "@/server/domain/models/circle-invite-link/circle-invite-link-repository";
import {
  createInMemoryCircleRepository,
  type CircleStore,
  type CircleMembershipStore,
} from "./in-memory-circle-repository";
import {
  createInMemoryCircleSessionRepository,
  type CircleSessionStore,
  type CircleSessionMembershipStore,
} from "./in-memory-circle-session-repository";
import {
  createInMemoryUserRepository,
  type UserStore,
} from "./in-memory-user-repository";
import {
  createInMemoryMatchRepository,
  type MatchStore,
} from "./in-memory-match-repository";
import {
  createInMemoryCircleInviteLinkRepository,
  type CircleInviteLinkStore,
} from "./in-memory-circle-invite-link-repository";
import { createInMemoryAuthzRepository } from "./in-memory-authz-repository";
import { createInMemoryUnitOfWork } from "./in-memory-unit-of-work";
import type { UnitOfWork } from "@/server/application/common/unit-of-work";

export type InMemoryStores = {
  circleStore: CircleStore;
  circleMembershipStore: CircleMembershipStore;
  circleSessionStore: CircleSessionStore;
  circleSessionMembershipStore: CircleSessionMembershipStore;
  userStore: UserStore;
  matchStore: MatchStore;
  circleInviteLinkStore: CircleInviteLinkStore;
};

export type InMemoryRepositories = {
  repos: Repositories & {
    circleInviteLinkRepository: CircleInviteLinkRepository;
  };
  unitOfWork: UnitOfWork;
  stores: InMemoryStores;
};

export const createInMemoryRepositories = (): InMemoryRepositories => {
  const circleStore: CircleStore = new Map();
  const circleMembershipStore: CircleMembershipStore = new Map();
  const circleSessionStore: CircleSessionStore = new Map();
  const circleSessionMembershipStore: CircleSessionMembershipStore = new Map();
  const userStore: UserStore = new Map();
  const matchStore: MatchStore = new Map();
  const circleInviteLinkStore: CircleInviteLinkStore = new Map();

  const circleRepository = createInMemoryCircleRepository(
    circleStore,
    circleMembershipStore,
  );
  const circleSessionRepository = createInMemoryCircleSessionRepository(
    circleSessionStore,
    circleSessionMembershipStore,
  );
  const userRepository = createInMemoryUserRepository(userStore);
  const matchRepository = createInMemoryMatchRepository(matchStore, {
    circleSessionStore,
    circleStore,
  });
  const circleInviteLinkRepository =
    createInMemoryCircleInviteLinkRepository(circleInviteLinkStore);
  const authzRepository = createInMemoryAuthzRepository({
    userStore,
    circleMembershipStore,
    circleSessionMembershipStore,
  });

  const repos = {
    circleRepository,
    circleSessionRepository,
    matchRepository,
    userRepository,
    authzRepository,
    circleInviteLinkRepository,
  };

  const unitOfWork = createInMemoryUnitOfWork(repos);

  return {
    repos,
    unitOfWork,
    stores: {
      circleStore,
      circleMembershipStore,
      circleSessionStore,
      circleSessionMembershipStore,
      userStore,
      matchStore,
      circleInviteLinkStore,
    },
  };
};

export { createInMemoryCircleRepository } from "./in-memory-circle-repository";
export { createInMemoryCircleSessionRepository } from "./in-memory-circle-session-repository";
export { createInMemoryUserRepository } from "./in-memory-user-repository";
export { createInMemoryMatchRepository } from "./in-memory-match-repository";
export { createInMemoryCircleInviteLinkRepository } from "./in-memory-circle-invite-link-repository";
export { createInMemoryAuthzRepository } from "./in-memory-authz-repository";
export { createInMemoryUnitOfWork } from "./in-memory-unit-of-work";
