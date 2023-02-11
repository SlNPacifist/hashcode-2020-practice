import * as fs from 'fs';
import * as path from 'path';
import parseInput from './input';
import { InputData, OutputData } from './types';
import { numbers } from './parser';
import assert from 'assert';
import _ from "lodash";

function parseOutput(outputContent: string): OutputData {
    const res: OutputData = [];
    const seenLibs = new Set();
    const lines = outputContent.split('\n').reverse();

    let nLibs = Number(lines.pop());

    while (nLibs--) {
        const [ libId, nBooks ] = numbers(lines);
        const bookIds = numbers(lines);

        assert(!seenLibs.has(libId));
        seenLibs.add(libId);
        assert.equal(nBooks, bookIds.length);
        assert.equal(nBooks, new Set(bookIds).size);

        res.push({
            library: libId,
            books: bookIds,
        });
    }

    return res;
}

export function calculateScore(input: InputData, output: OutputData) {
    let result = 0;
    const countedBooks = new Set();
    const countedLibraries = new Set();

    let nextLibDay = 0;

    for (const { books, library } of output) {
        assert(!countedLibraries.has(library), `Library #${library} duplicated.`);
        assert.equal(books.length, new Set(books).size, `Books duplicated in lib #${library}.`);

        countedLibraries.add(library);
        const lib = input.libraries[library];

        nextLibDay += lib.signup;
        let libDay = nextLibDay;
        let libBooksCounted = 0;

        while (libDay++ < input.days) {
            let processedDayBooks = 0;
            while (processedDayBooks++ < lib.booksPerDay && libBooksCounted < books.length) {
                const book = books[libBooksCounted++];

                if (!countedBooks.has(book)) {
                    result += input.bookPrices[book];
                    countedBooks.add(book);
                }
            }
        }
    }

    return result;
}

// function calculateScoreFile(inputPath: string, outputPath: string) {
//     const outputContent = fs.readFileSync(outputPath, 'utf-8');
//     const input = parseInput(inputPath);
//     const output = parseOutput(outputContent);
//     console.log(input, output);
//     console.log(calculateScore(input, output));
// }

// calculateScoreFile(
//     path.resolve(process.cwd(), 'input/a_example.txt'),
//     path.resolve(process.cwd(), 'output/pdf_example.txt'),
// );
