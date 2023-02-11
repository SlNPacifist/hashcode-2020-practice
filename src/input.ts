import * as fs from "fs";
import type { InputData, Library } from "./types";
import { numbers } from "./parser";

export default function readFile(filename: string): InputData {
    const data = fs.readFileSync(filename, 'utf-8');
    const lines = data.split('\n').reverse();

    let [b, l, d] = numbers(lines);
    const bookPrices = numbers(lines);
    const libraries: Array<Library> = [];

    while (l--) {
        let [n, t, m] = numbers(lines);
        libraries.push({
            books: numbers(lines),
            booksPerDay: m,
            signup: t,
        })
    }

    return {
        bookPrices,
        libraries,
        days: d,
    };
}
