import { table } from 'table';
import _ from 'lodash';
import * as fs from 'node:fs/promises';

import readFile from './input';
import { calculateScore } from './score';
import type { Solution } from './types';
const files: Array<string> = [
    // file names in input
];

// relative to this file
const solutionsPath = './solutions';

async function loadSolutions(): Promise<Record<string, Solution>> {
    const fullSolutionsPath = `${__dirname}/${solutionsPath}`;
    const solutionNames = await fs.readdir(fullSolutionsPath);
    const solutions = await Promise.all(
        solutionNames.map(name => import(`${solutionsPath}/${name}`) as Promise<Solution>)
    );

    return _.zipObject(solutionNames, solutions);
}

async function run() {
    const solutions = await loadSolutions();
    const tableData = [['', ...Object.keys(solutions), 'best']];
    const totalScore = new Array<number>(Object.keys(solutions).length + 1).fill(0);
    const solutionFuncs = Object.values(solutions);
    for (const input_file of files) {
        const full_input_file = `./input/${input_file}`;
        const data = readFile(full_input_file);
        const tableRow = [input_file];
        let best = 0;
        for (let i = 0; i < solutionFuncs.length; i += 1) {
            const solve = solutionFuncs[i];
            const solution = solve(data);
            const score = calculateScore(full_input_file, solution);
            tableRow.push(String(score));
            totalScore[i] += score;
            best = Math.max(best, score);
        }
        totalScore[solutionFuncs.length] += best;
        tableRow.push(String(best));
        tableData.push(tableRow);
    }
    
    tableData.push(['Total', ...totalScore.map(String)]);
    console.log(table(tableData, { columnDefault: { alignment: 'right' }}));
}

run().catch(e => {
    console.log(e);
    process.exit(1);
})