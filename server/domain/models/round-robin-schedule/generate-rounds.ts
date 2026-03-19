import type { UserId } from "../../common/ids";
import { BadRequestError } from "../../common/errors";

export type Pairing = {
  player1Id: UserId;
  player2Id: UserId;
};

export type Round = {
  roundNumber: number;
  pairings: Pairing[];
};

/**
 * ラウンドロビン対戦スケジュールを生成する（サークルメソッド）
 *
 * - 先頭の参加者を固定し、残りを回転させてペアリングを作る
 * - 奇数人数の場合は BYE（null）を追加し、BYE とのペアリングは除外する
 */
export const generateRounds = (participantIds: UserId[]): Round[] => {
  if (participantIds.length < 2) {
    throw new BadRequestError(
      "Round-robin requires at least 2 participants",
    );
  }

  const uniqueIds = new Set(participantIds);
  if (uniqueIds.size !== participantIds.length) {
    throw new BadRequestError("Duplicate participant IDs are not allowed");
  }

  // 入力をシャッフルして毎回異なる対戦順序を生成（Fisher-Yates）
  const shuffled = [...participantIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // 奇数の場合は BYE (null) を追加して偶数にする
  const players: (UserId | null)[] = [...shuffled];
  if (players.length % 2 !== 0) {
    players.push(null);
  }

  const n = players.length;
  const totalRounds = n - 1;
  const rounds: Round[] = [];

  // サークルメソッド: 先頭固定、残りを回転
  const fixed = players[0];
  const rotating = players.slice(1);

  for (let r = 0; r < totalRounds; r++) {
    const pairings: Pairing[] = [];

    // 先頭 vs 回転リストの最後
    const opponent = rotating[rotating.length - 1];
    if (fixed !== null && opponent !== null) {
      pairings.push({ player1Id: fixed, player2Id: opponent });
    }

    // 残りのペアリング: 対称的に内側へ
    for (let i = 0; i < (n - 2) / 2; i++) {
      const p1 = rotating[i];
      const p2 = rotating[rotating.length - 2 - i];
      if (p1 !== null && p2 !== null) {
        pairings.push({ player1Id: p1, player2Id: p2 });
      }
    }

    rounds.push({ roundNumber: r + 1, pairings });

    // 回転: 最後の要素を先頭に移動
    rotating.unshift(rotating.pop()!);
  }

  return rounds;
};
