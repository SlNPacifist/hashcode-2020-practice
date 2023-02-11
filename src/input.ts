import * as fs from "fs";
import type { InputData } from "./types";
import { numbers } from "./parser";

export default function readFile(filename: string): InputData {
    const data = fs.readFileSync(filename, 'utf-8');
    const lines = data.split('\n').reverse();

    return {
    };
}
