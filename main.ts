// main.ts
import { getBestMove, Board } from "./ttt-ai";

const board: Board = [
  "X","O","X",
  "O","","",
  "","", ""
];

const ai = "O";
console.log("master:", getBestMove(board, ai, { level: "master" })); // 大师模式，开局常为 4
console.log("novice:", getBestMove(board, ai, { level: "novice" })); // 新手模式，偶尔选次优
console.log("random:", getBestMove(board, ai, { level: "random" }));