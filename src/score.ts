import * as fs from 'fs';
import parseInput from './input';
import { InputData, OutputData } from './types';
import { numbers } from './parser';
import assert from 'assert';
import _ from "lodash";

// function parseOutput(outputContent: string): OutputData {
//     const res: OutputData = [];
//     // Array<[number, Set<number>]>
//     const lines = outputContent.split('\n').reverse();

//     let n = Number(lines.pop());
//     while (n--) {
//         let [id, ...videoIds] = numbers(lines);
//         res[id] = new Set(videoIds);
//     }
//     for (let i = 0; i < res.length; i += 1) {
//         if (!res[i]) {
//             res[i] = new Set();
//         }
//     }

//     return res;
// }

// export function calculateScoreFile(inputPath: string, outputPath: string) {
//     const outputContent = fs.readFileSync(outputPath, 'utf-8');
//     const output = parseOutput(outputContent);
//     return calculateScore(inputPath, output);
// }

// function validateOutput(input: InputData, output: OutputData) {
//     assert.equal(output.length, input.cacheServersCount);
//     for (const videos of output) {
//         const sizeSum = _.sum([...videos].map(id => input.videoSizes[id]));
//         assert(sizeSum <= input.cacheServerSize, `Cache server videos size is ${sizeSum}, expected no more than ${input.cacheServerSize}`);
//     }
// }

export function calculateScore(input: InputData, output: OutputData) {
    let result = 0;
    const countedBooks = new Set();

    let nextLibDay = 0;

    for (const { books, library } of output) {
        const lib = input.libraries[library];

        let libBooksCounted = 0;
        nextLibDay += lib.signup;
        let libDay = nextLibDay;

        while (libDay < input.days) {
            let processedDayBooks = 0;
            while (processedDayBooks < lib.booksPerDay && libBooksCounted < books.length) {
                const book = books[libBooksCounted++];

                if (!countedBooks.has(books[book])) {
                    result += input.bookPrices[book];
                    countedBooks.add(book);
                }
                processedDayBooks++;
            }
            libDay++;
        }
    }

    return result;
}
