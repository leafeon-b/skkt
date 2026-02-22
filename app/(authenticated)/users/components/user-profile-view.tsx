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
    </div>
  );
}
