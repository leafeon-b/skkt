import type { UserProfileViewModel } from "@/server/presentation/view-models/user-profile";
import Image from "next/image";

type UserProfileViewProps = {
  profile: UserProfileViewModel;
};

export function UserProfileView({ profile }: UserProfileViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <section className="rounded-2xl border border-border/60 bg-white/90 p-8 shadow-sm">
        <div className="flex items-center gap-6">
          {profile.image ? (
            <Image
              src={profile.image}
              alt={profile.name}
              width={80}
              height={80}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-(--brand-moss)/20 text-2xl font-bold text-(--brand-ink)">
              {profile.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-(--brand-ink)">
              {profile.name}
            </h1>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-8 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-(--brand-ink)">活動記録</h2>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-(--brand-moss)">
            {profile.sessionParticipationCount}
          </span>
          <span className="text-sm text-muted-foreground">回参加</span>
        </div>
        <div className="mt-4 flex gap-6">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-(--brand-moss)">
              {profile.matchStatistics.wins}
            </span>
            <span className="text-sm text-muted-foreground">勝</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-(--brand-ink)">
              {profile.matchStatistics.losses}
            </span>
            <span className="text-sm text-muted-foreground">敗</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-muted-foreground">
              {profile.matchStatistics.draws}
            </span>
            <span className="text-sm text-muted-foreground">分</span>
          </div>
        </div>
      </section>
    </div>
  );
}
