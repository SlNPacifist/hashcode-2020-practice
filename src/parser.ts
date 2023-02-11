export function numbers(lines: Array<string>) {
    return lines.pop()!.split(' ').map(Number);
}
