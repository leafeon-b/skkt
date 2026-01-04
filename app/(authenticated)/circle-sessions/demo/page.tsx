import {
  createDemoCircleSessionDetailProvider,
  demoRoleLinks,
} from "@/app/(authenticated)/circle-sessions/demo/demo-circle-session-detail-provider";
import type { CircleSessionRoleKey } from "@/server/presentation/view-models/circle-session-detail";
import { CircleSessionDetailContainer } from "@/app/(authenticated)/circle-sessions/components/circle-session-detail-container";

type CircleSessionDemoPageProps = {
  role?: CircleSessionRoleKey;
};

export function CircleSessionDemoPage({ role }: CircleSessionDemoPageProps) {
  return (
    <CircleSessionDetailContainer
      provider={createDemoCircleSessionDetailProvider(role)}
      circleSessionId="demo-session-42"
      viewerId={null}
      roleLinks={demoRoleLinks}
    />
  );
}

export default function CircleSessionDemoOwnerPage() {
  return <CircleSessionDemoPage role="owner" />;
}
