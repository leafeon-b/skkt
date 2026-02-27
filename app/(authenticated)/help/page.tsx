import { ExternalLink } from "lucide-react";

const contactFormUrl = process.env.NEXT_PUBLIC_CONTACT_FORM_URL;

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
          aria-label="研究会ロール権限一覧"
        >
          <table className="w-full text-sm text-(--brand-ink-muted)">
            <thead>
              <tr className="border-b border-border/60 text-left">
                <th
                  scope="col"
                  className="pb-2 pr-4 font-semibold text-(--brand-ink)"
                >
                  操作
                </th>
                <th
                  scope="col"
                  className="pb-2 text-center font-semibold text-(--brand-ink)"
                >
                  オーナー
                </th>
                <th
                  scope="col"
                  className="pb-2 text-center font-semibold text-(--brand-ink)"
                >
                  マネージャー
                </th>
                <th
                  scope="col"
                  className="pb-2 text-center font-semibold text-(--brand-ink)"
                >
                  メンバー
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr>
                <th scope="row" className="py-3 pr-4 text-left font-medium whitespace-nowrap text-(--brand-ink)">
                  研究会の編集
                </th>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">—</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 text-left font-medium whitespace-nowrap text-(--brand-ink)">
                  研究会の削除
                </th>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">—</td>
                <td className="py-3 text-center">—</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 text-left font-medium whitespace-nowrap text-(--brand-ink)">
                  メンバーの追加
                </th>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">○</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 text-left font-medium whitespace-nowrap text-(--brand-ink)">
                  メンバーの除外
                </th>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">—</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 text-left font-medium whitespace-nowrap text-(--brand-ink)">
                  ロール変更
                </th>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">○ ※</td>
                <td className="py-3 text-center">—</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 text-left font-medium whitespace-nowrap text-(--brand-ink)">
                  オーナー移譲
                </th>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">—</td>
                <td className="py-3 text-center">—</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 text-left font-medium whitespace-nowrap text-(--brand-ink)">
                  セッション作成
                </th>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">—</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 text-left font-medium whitespace-nowrap text-(--brand-ink)">
                  対局の記録・閲覧・修正・削除
                </th>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">○</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-(--brand-ink-muted)">
          ※ マネージャーは自分より上位のロールの変更不可
        </p>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          セッションロール
        </h2>
        <div
          className="mt-4 overflow-x-auto rounded-md focus:outline-2 focus:outline-offset-2 focus:outline-(--brand-moss)"
          tabIndex={0}
          role="region"
          aria-label="セッションロール権限一覧"
        >
          <table className="w-full text-sm text-(--brand-ink-muted)">
            <thead>
              <tr className="border-b border-border/60 text-left">
                <th
                  scope="col"
                  className="pb-2 pr-4 font-semibold text-(--brand-ink)"
                >
                  操作
                </th>
                <th
                  scope="col"
                  className="pb-2 text-center font-semibold text-(--brand-ink)"
                >
                  オーナー
                </th>
                <th
                  scope="col"
                  className="pb-2 text-center font-semibold text-(--brand-ink)"
                >
                  マネージャー
                </th>
                <th
                  scope="col"
                  className="pb-2 text-center font-semibold text-(--brand-ink)"
                >
                  メンバー
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr>
                <th scope="row" className="py-3 pr-4 text-left font-medium whitespace-nowrap text-(--brand-ink)">
                  セッションの編集
                </th>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">—</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 text-left font-medium whitespace-nowrap text-(--brand-ink)">
                  セッションの削除
                </th>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">—</td>
                <td className="py-3 text-center">—</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 text-left font-medium whitespace-nowrap text-(--brand-ink)">
                  メンバーの追加
                </th>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">○</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 text-left font-medium whitespace-nowrap text-(--brand-ink)">
                  メンバーの除外
                </th>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">—</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 text-left font-medium whitespace-nowrap text-(--brand-ink)">
                  ロール変更
                </th>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">○ ※</td>
                <td className="py-3 text-center">—</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 text-left font-medium whitespace-nowrap text-(--brand-ink)">
                  オーナー移譲
                </th>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">—</td>
                <td className="py-3 text-center">—</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 text-left font-medium whitespace-nowrap text-(--brand-ink)">
                  対局の記録・閲覧・修正・削除
                </th>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">○</td>
                <td className="py-3 text-center">○</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-(--brand-ink-muted)">
          ※ マネージャーは自分より上位のロールの変更不可
        </p>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">補足</h2>
        <ul className="mt-4 space-y-3 text-sm text-(--brand-ink-muted)">
          <li>・オーナー移譲時、移譲元のオーナーはマネージャーになります。</li>
          <li>
            ・対局結果の記録・閲覧・修正・削除は、研究会参加者またはセッション参加者であればロールを問わず可能です。
          </li>
        </ul>
      </section>

      {contactFormUrl && (
        <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-(--brand-ink)">
            お問い合わせ
          </h2>
          <p className="mt-4 text-sm text-(--brand-ink-muted)">
            ご意見・ご要望・不具合の報告などは、以下のフォームからお寄せください。
          </p>
          <a
            href={contactFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-(--brand-moss) hover:underline"
          >
            お問い合わせフォームを開く
            <ExternalLink className="size-4" />
          </a>
        </section>
      )}
    </div>
  );
}
