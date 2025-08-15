// minimax.ts
export type CellValue = "X" | "O" | "";
export type Player    = "X" | "O";
export type Board     = CellValue[]; // 长度=9

const LINES: number[][] = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

export interface GetBestMoveOptions {
  // 难度："master" 总是最优；"novice" 40% 选最优、60% 选次优
  level?: "master" | "novice" | "random";
}

const ORDER = [4,0,2,6,8,1,3,5,7]; // 中心 > 角 > 边

// 置换表（记忆化）：key = boardStr + toMove
const TT = new Map<string, number>();

function boardKey(board: Board, toMove: Player): string {
  // 用 'X','O','.' 编码
  const s = board.map(c => (c === "" ? "." : c)).join("");
  return s + "|" + toMove;
}

// 终局评分（以 X 视角），带“深度奖励”：更快赢分更高、更慢输分更低
// depth = 当前递归深度（已走的步数）
// X 胜：+ (10 - depth)；O 胜：- (10 - depth)；和棋：0；非终局：null
function evaluateTerminal(board: Board, depth: number): number | null {
  for (const [a,b,c] of LINES) {
    const v = board[a];
    if (v !== "" && v === board[b] && v === board[c]) {
      return v === "X" ? (10 - depth) : -(10 - depth);
    }
  }
  return board.includes("") ? null : 0;
}

// Minimax + αβ剪枝（以 X 视角评分）
function minimax(
  board: Board,
  toMove: Player,
  alpha: number,
  beta: number,
  depth: number
): number {
  const term = evaluateTerminal(board, depth);
  if (term !== null) return term;

  const key = boardKey(board, toMove);
  const hit = TT.get(key);
  if (hit !== undefined) return hit;

  if (toMove === "X") {
    let best = -Infinity;
    // 人类化排序
    for (const i of ORDER) {
      if (board[i] !== "") continue;
      board[i] = "X";
      const score = minimax(board, "O", alpha, beta, depth + 1);
      board[i] = "";
      if (score > best) best = score;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break; // β剪枝
    }
    TT.set(key, best);
    return best;
  } else {
    let best = +Infinity;
    for (const i of ORDER) {
      if (board[i] !== "") continue;
      board[i] = "O";
      const score = minimax(board, "X", alpha, beta, depth + 1);
      board[i] = "";
      if (score < best) best = score;
      if (best < beta) beta = best;
      if (alpha >= beta) break; // α剪枝
    }
    TT.set(key, best);
    return best;
  }
}

// 主入口：返回最佳落子索引（0..8）；无合法步返回 -1
export function getBestMove(
  board: Board,
  aiPlayer: Player,
  options: GetBestMoveOptions = { level: "master" }
): number {
  TT.clear(); // 每次搜索清缓存（井字棋很小，这样够用）

  // 终局：无步可走
  if (evaluateTerminal(board, /*depth=*/0) !== null) return -1;

  const opponent: Player = aiPlayer === "X" ? "O" : "X";
  const scored: { idx: number; score: number }[] = [];

  for (const i of ORDER) {
    if (board[i] !== "") continue;
    board[i] = aiPlayer;
    // 注意：minimax 一直是“以 X 视角评分”
    const score = minimax(board, opponent, -Infinity, +Infinity, 1);
    board[i] = "";
    scored.push({ idx: i, score });
  }

  // 根据 AI 扮演一方，选择“最优分数”的方向
  if (aiPlayer === "X") {
    scored.sort((a, b) => b.score - a.score); // 分高更好
  } else {
    scored.sort((a, b) => a.score - b.score); // 分低更好（因为分数是以 X 视角）
  }

  // 难度控制
  const level = options.level ?? "master";
    if (level === "random") {
      // 纯随机选一个合法落子
      if (scored.length === 0) return -1;
      const r = Math.floor(Math.random() * scored.length);
      return scored[r].idx;
    }
    if (level === "novice" && scored.length >= 2) {
      // 40% 选最优，60% 选次优
      return Math.random() * 100 <= 40 ? scored[0].idx : scored[1].idx;
    }

    return scored.length ? scored[0].idx : -1;
}