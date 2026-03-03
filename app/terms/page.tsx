import { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約 - SKKT",
};

export default function TermsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="rounded-3xl border border-border/60 bg-white/90 p-8 shadow-sm">
        <h1 className="mt-3 text-3xl font-(--font-display) text-(--brand-ink) sm:text-4xl">
          利用規約
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-(--brand-ink-muted) sm:text-base">
          本利用規約（以下「本規約」）は、SKKT（将棋研究会管理ツール）（以下「本サービス」）の利用条件を定めるものです。ユーザーの皆様には、本規約に同意の上、本サービスをご利用いただきます。
        </p>
      </header>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第1条（適用）
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-(--brand-ink-muted)">
          本規約は、ユーザーと本サービス運営者との間の本サービスの利用に関わる一切の関係に適用されます。
        </p>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第2条（利用登録）
        </h2>
        <ol className="mt-4 list-inside list-decimal space-y-2 text-sm leading-relaxed text-(--brand-ink-muted)">
          <li>
            登録希望者が本規約に同意の上、運営者の定める方法によって利用登録を申請し、運営者がこれを承認することによって、利用登録が完了するものとします。
          </li>
          <li>
            運営者は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあります。
            <ul className="mt-2 ml-5 list-disc space-y-1">
              <li>虚偽の事項を届け出た場合</li>
              <li>本規約に違反したことがある者からの申請である場合</li>
              <li>その他、運営者が利用登録を相当でないと判断した場合</li>
            </ul>
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第3条（アカウントの管理）
        </h2>
        <ol className="mt-4 list-inside list-decimal space-y-2 text-sm leading-relaxed text-(--brand-ink-muted)">
          <li>
            ユーザーは、自己の責任において、本サービスのアカウント情報を適切に管理するものとします。
          </li>
          <li>
            ユーザーは、いかなる場合にも、アカウントを第三者に譲渡または貸与することはできません。
          </li>
          <li>
            アカウント情報が第三者によって使用されたことで生じた損害は、運営者に故意または重大な過失がある場合を除き、運営者は一切の責任を負わないものとします。
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第4条（禁止事項）
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-(--brand-ink-muted)">
          ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
        </p>
        <ul className="mt-3 ml-5 list-disc space-y-1 text-sm leading-relaxed text-(--brand-ink-muted)">
          <li>法令または公序良俗に違反する行為</li>
          <li>犯罪行為に関連する行為</li>
          <li>
            本サービスのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為
          </li>
          <li>本サービスの運営を妨害するおそれのある行為</li>
          <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
          <li>不正アクセスをし、またはこれを試みる行為</li>
          <li>他のユーザーに成りすます行為</li>
          <li>
            本サービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為
          </li>
          <li>その他、運営者が不適切と判断する行為</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第5条（本サービスの提供の停止等）
        </h2>
        <ol className="mt-4 list-inside list-decimal space-y-2 text-sm leading-relaxed text-(--brand-ink-muted)">
          <li>
            運営者は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
            <ul className="mt-2 ml-5 list-disc space-y-1">
              <li>本サービスにかかるシステムの保守点検または更新を行う場合</li>
              <li>
                地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合
              </li>
              <li>その他、運営者が本サービスの提供が困難と判断した場合</li>
            </ul>
          </li>
          <li>
            運営者は、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第6条（利用制限およびアカウント削除）
        </h2>
        <ol className="mt-4 list-inside list-decimal space-y-2 text-sm leading-relaxed text-(--brand-ink-muted)">
          <li>
            運営者は、ユーザーが以下のいずれかに該当する場合には、事前の通知なく、ユーザーに対して本サービスの全部もしくは一部の利用を制限し、またはアカウントを削除することができるものとします。
            <ul className="mt-2 ml-5 list-disc space-y-1">
              <li>本規約のいずれかの条項に違反した場合</li>
              <li>
                その他、運営者が本サービスの利用を適当でないと判断した場合
              </li>
            </ul>
          </li>
          <li>
            運営者は、本条に基づき運営者が行った行為によりユーザーに生じた損害について、一切の責任を負いません。
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第7条（免責事項）
        </h2>
        <ol className="mt-4 list-inside list-decimal space-y-2 text-sm leading-relaxed text-(--brand-ink-muted)">
          <li>
            本サービスは個人が運営する無料サービスであり、運営者は本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
          </li>
          <li>
            運営者は、本サービスに起因してユーザーに生じたあらゆる損害について、運営者の故意または重大な過失による場合を除き、一切の責任を負いません。
          </li>
          <li>
            運営者は、本サービスに関して、ユーザー間またはユーザーと第三者との間で生じた取引、連絡または紛争等について一切責任を負いません。
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第8条（サービス内容の変更等）
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-(--brand-ink-muted)">
          運営者は、ユーザーへの事前の告知をもって、本サービスの内容を変更、追加または廃止することがあり、ユーザーはこれを承諾するものとします。
        </p>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第9条（利用規約の変更）
        </h2>
        <ol className="mt-4 list-inside list-decimal space-y-2 text-sm leading-relaxed text-(--brand-ink-muted)">
          <li>
            運営者は、必要と判断した場合には、ユーザーの個別の同意を要せず、本規約を変更することができるものとします。
          </li>
          <li>
            本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          第10条（準拠法・裁判管轄）
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-(--brand-ink-muted)">
          本規約の解釈にあたっては、日本法を準拠法とします。
        </p>
      </section>
    </div>
  );
}
