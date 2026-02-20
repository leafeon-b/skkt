export default function HelpPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="rounded-3xl border border-border/60 bg-white/90 p-8 shadow-sm">
        <h1 className="mt-3 text-3xl font-(--font-display) text-(--brand-ink) sm:text-4xl">
          SKKTについて
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-(--brand-ink-muted) sm:text-base">
          SKKT(将棋研究会管理ツール)は研究会の活動記録を効率的に行うための記録ツールです。
        </p>
      </header>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          使い方のポイント
        </h2>
        <ul className="mt-4 space-y-3 text-sm text-(--brand-ink-muted)">
          <li>・研究会のメンバーと予定を、まとめて迷わず整理できます。</li>
          <li>・対局結果は、その場ですぐ残せます。</li>
          <li>・記録はメンバー全員に行き渡り、共有がスムーズです。</li>
          <li>・自分の記録を可視化し、次の活動に活かせます。</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          研究会ロール
        </h2>
        <div
          className="mt-4 overflow-x-auto rounded-md focus:outline-2 focus:outline-offset-2 focus:outline-(--brand-moss)"
          tabIndex={0}
          role="region"
          aria-label="研究会ロール一覧"
        >
          <table className="w-full text-sm text-(--brand-ink-muted)">
            <thead>
              <tr className="border-b border-border/60 text-left">
                <th
                  scope="col"
                  className="pb-2 pr-4 font-semibold text-(--brand-ink)"
                >
                  ロール
                </th>
                <th
                  scope="col"
                  className="pb-2 font-semibold text-(--brand-ink)"
                >
                  説明
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr>
                <td className="py-3 pr-4 align-top font-medium whitespace-nowrap text-(--brand-ink)">
                  オーナー
                </td>
                <td className="py-3">
                  研究会の所有者。研究会の編集・削除、メンバーの追加・除外・ロール変更、オーナー移譲、セッション作成など全権限を持つ。オーナーは1名のみ。
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 align-top font-medium whitespace-nowrap text-(--brand-ink)">
                  マネージャー
                </td>
                <td className="py-3">
                  研究会の管理者。研究会の編集、メンバーの追加・除外・ロール変更（自分より上位のロールは変更不可）、セッション作成が可能。研究会の削除・オーナー移譲はできない。
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 align-top font-medium whitespace-nowrap text-(--brand-ink)">
                  メンバー
                </td>
                <td className="py-3">
                  研究会の参加者。対局の記録・閲覧・修正・削除、メンバーの追加が可能。研究会の編集・削除、メンバーの除外・ロール変更、セッション作成はできない。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          セッションロール
        </h2>
        <div
          className="mt-4 overflow-x-auto rounded-md focus:outline-2 focus:outline-offset-2 focus:outline-(--brand-moss)"
          tabIndex={0}
          role="region"
          aria-label="セッションロール一覧"
        >
          <table className="w-full text-sm text-(--brand-ink-muted)">
            <thead>
              <tr className="border-b border-border/60 text-left">
                <th
                  scope="col"
                  className="pb-2 pr-4 font-semibold text-(--brand-ink)"
                >
                  ロール
                </th>
                <th
                  scope="col"
                  className="pb-2 font-semibold text-(--brand-ink)"
                >
                  説明
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr>
                <td className="py-3 pr-4 align-top font-medium whitespace-nowrap text-(--brand-ink)">
                  オーナー
                </td>
                <td className="py-3">
                  セッションの所有者。セッションの編集・削除、メンバーの追加・除外・ロール変更、オーナー移譲など全権限を持つ。オーナーは1名のみ。
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 align-top font-medium whitespace-nowrap text-(--brand-ink)">
                  マネージャー
                </td>
                <td className="py-3">
                  セッションの管理者。セッションの編集、メンバーの追加・除外・ロール変更（自分より上位のロールは変更不可）が可能。セッションの削除・オーナー移譲はできない。
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 align-top font-medium whitespace-nowrap text-(--brand-ink)">
                  メンバー
                </td>
                <td className="py-3">
                  セッションの参加者。対局の記録・閲覧・修正・削除、メンバーの追加が可能。セッションの編集・削除、メンバーの除外・ロール変更はできない。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">補足</h2>
        <ul className="mt-4 space-y-3 text-sm text-(--brand-ink-muted)">
          <li>・オーナー移譲時、移譲元のオーナーはマネージャーになります。</li>
          <li>
            ・対局結果の記録・閲覧・修正・削除・編集履歴の閲覧は、研究会参加者またはセッション参加者であればロールを問わず可能です。
          </li>
        </ul>
      </section>
    </div>
  );
}
