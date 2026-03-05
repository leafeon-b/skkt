import { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー - SKKT",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="rounded-3xl border border-border/60 bg-white/90 p-8 shadow-sm">
        <h1 className="mt-3 text-3xl font-(--font-display) text-(--brand-ink) sm:text-4xl">
          プライバシーポリシー
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-(--brand-ink-muted) sm:text-base">
          SKKT（将棋研究会管理ツール）（以下「本サービス」）における個人情報の取り扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
        </p>
      </header>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第1条（個人情報の定義）
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-(--brand-ink-muted)">
          本ポリシーにおいて「個人情報」とは、個人情報保護法に規定される個人情報を指し、メールアドレス、表示名その他の記述等により特定の個人を識別できる情報をいいます。
        </p>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第2条（個人情報の収集方法）
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-(--brand-ink-muted)">
          運営者は、ユーザーが利用登録をする際に、以下の個人情報を取得します。
        </p>
        <ul className="mt-3 ml-5 list-disc space-y-1 text-sm leading-relaxed text-(--brand-ink-muted)">
          <li>メールアドレス</li>
          <li>表示名（ニックネーム）</li>
          <li>プロフィール画像（Googleアカウント連携時）</li>
          <li>アカウント作成日時</li>
          <li>プロフィール公開範囲の設定</li>
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-(--brand-ink-muted)">
          また、ユーザーが本サービスを利用する過程で、以下の情報が記録されます。
        </p>
        <ul className="mt-3 ml-5 list-disc space-y-1 text-sm leading-relaxed text-(--brand-ink-muted)">
          <li>研究会の参加情報</li>
          <li>対局記録（対局日、対局者、結果等）</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第3条（個人情報の利用目的）
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-(--brand-ink-muted)">
          運営者は、収集した個人情報を以下の目的で利用します。
        </p>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-relaxed text-(--brand-ink-muted)">
          <li>本サービスの提供および運営</li>
          <li>ユーザーの本人確認およびアカウント管理</li>
          <li>メンテナンス、重要なお知らせ等の連絡</li>
          <li>本サービスの改善および新機能の開発</li>
          <li>利用規約に違反する行為への対応</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第4条（利用目的の変更）
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-(--brand-ink-muted)">
          運営者は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。利用目的の変更を行った場合には、ユーザーに通知または本サービス上に公表するものとします。
        </p>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第5条（個人情報の第三者提供）
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-(--brand-ink-muted)">
          運営者は、以下の場合を除き、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。
        </p>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-relaxed text-(--brand-ink-muted)">
          <li>法令に基づく場合</li>
          <li>
            人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき
          </li>
          <li>
            国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第6条（個人情報の安全管理）
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-(--brand-ink-muted)">
          運営者は、個人情報の正確性および安全性を確保するために、セキュリティに十分な対策を講じ、個人情報の漏えい、滅失またはき損の防止に努めます。
        </p>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第7条（個人情報の開示・訂正・削除）
        </h2>
        <ol className="mt-4 list-inside list-decimal space-y-2 text-sm leading-relaxed text-(--brand-ink-muted)">
          <li>
            ユーザーは、運営者に対し、自己の個人情報の開示を求めることができます。
          </li>
          <li>
            ユーザーの個人情報に誤りがある場合、ユーザーは運営者に対して訂正または削除を求めることができます。
          </li>
          <li>
            運営者は、ユーザーから前項の請求を受けた場合、対応が必要と判断したときは、遅滞なく当該個人情報の訂正または削除を行い、ユーザーに通知します。
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第8条（プライバシーポリシーの変更）
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-(--brand-ink-muted)">
          運営者は、必要に応じて、本ポリシーを変更することがあります。変更後のプライバシーポリシーは、本サービス上に掲載した時点から効力を生じるものとします。
        </p>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第9条（お問い合わせ）
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-(--brand-ink-muted)">
          本ポリシーに関するお問い合わせは、本サービス内のお問い合わせ機能よりご連絡ください。
        </p>
      </section>
    </div>
  );
}
