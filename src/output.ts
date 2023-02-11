import { OutputData } from "./types";

export function format(solution: OutputData) {
    return [
        solution.length,
        ...solution.map(l => `${l.library} ${l.books.length}\n${l.books.join(' ')}`)
    ].join('\n');
}
