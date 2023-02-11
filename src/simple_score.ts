import { InputData, OutputData } from "./types";

export function computeScore(inp: InputData, out: OutputData): number {
    let res = 0
    for (let lib of out) {
        for (let bookId of lib.books) {
            res += inp.bookPrices[bookId]
        }
    }
    return res
}
