import * as fs from 'fs';
import parseInput from './input';
import { InputData, OutputData } from './types';
import { numbers } from './parser';
import assert from 'assert';
import _ from "lodash";

function parseOutput(outputContent: string): OutputData {
    const res: OutputData = [];
    // Array<[number, Set<number>]>
    const lines = outputContent.split('\n').reverse();

    let n = Number(lines.pop());
    while (n--) {
        let [id, ...videoIds] = numbers(lines);
        res[id] = new Set(videoIds);
    }
    for (let i = 0; i < res.length; i += 1) {
        if (!res[i]) {
            res[i] = new Set();
        }
    }

    return res;
}

export function calculateScoreFile(inputPath: string, outputPath: string) {
    const outputContent = fs.readFileSync(outputPath, 'utf-8');
    const output = parseOutput(outputContent);
    return calculateScore(inputPath, output);
}

function validateOutput(input: InputData, output: OutputData) {
    assert.equal(output.length, input.cacheServersCount);
    for (const videos of output) {
        const sizeSum = _.sum([...videos].map(id => input.videoSizes[id]));
        assert(sizeSum <= input.cacheServerSize, `Cache server videos size is ${sizeSum}, expected no more than ${input.cacheServerSize}`);
    }
}

export function calculateScore(inputPath: string, output: OutputData) {
    const input = parseInput(inputPath);

    validateOutput(input, output);

    let savedTime = 0;
    let totalRequestAmount = 0;
    for (const { videoId, endpointId, requestsAmount } of input.requests) {
        const { dataCenterlatency, cacheServers } = input.endpoints[endpointId];
        let bestLatency = dataCenterlatency;
        for (const { cacheServerId, endpointLatency } of cacheServers) {
            if (output[cacheServerId].has(videoId)) {
                bestLatency = Math.min(bestLatency, endpointLatency);
            }
        }

        savedTime += requestsAmount * (dataCenterlatency - bestLatency);
        totalRequestAmount += requestsAmount;
    }
    return Math.floor(savedTime * 1000 / totalRequestAmount);
}
