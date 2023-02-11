import { InputData, Library, SignedLibrary, OutputData } from "../types";

type RuntimeLibrary = {
    id: number;
    inputLib: Library;
    outputLib: SignedLibrary;
    sortedBooks: number[];
    score: number;
};

function computeLibraryScore(lib: RuntimeLibrary, input: InputData): number {
    let remainingBooks = (input.days - lib.inputLib.signup) * lib.inputLib.booksPerDay
    if (remainingBooks <= 0)
        return 0
    
    let res = 0
    for (let bookId of lib.sortedBooks) {
        if (remainingBooks == 0)
            break
        res += input.bookPrices[bookId]
        --remainingBooks
    }

    return res / Math.sqrt(lib.inputLib.signup)
}

function makeRuntimeLibrary(id: number, lib: Library): RuntimeLibrary {
    let res: RuntimeLibrary = {
        id: id,
        inputLib: lib,
        outputLib: {
            library: id,
            books: []
        },
        sortedBooks: [...lib.books],
        score: 0
    }
    
    return res
}

function pushBooks(lib: RuntimeLibrary, processed: Set<number>, remainingDays: number) {
    let remainingBooks = remainingDays * lib.inputLib.booksPerDay
    for (let bookId of lib.sortedBooks) {
        if (processed.has(bookId))
            continue
        if (remainingBooks == 0)
            break
        lib.outputLib.books.push(bookId)
        --remainingBooks
        processed.add(bookId)
    }
}

function sortLibraries(libs: RuntimeLibrary[]): void {
    libs.sort((l1: RuntimeLibrary, l2: RuntimeLibrary) => {
        return l1.score - l2.score
    })
}

export const solve = ({ bookPrices, libraries, days }: InputData): OutputData => {
    let libs: RuntimeLibrary[] = libraries.map((l: Library, id: number) => makeRuntimeLibrary(id, l))
    libs.forEach((lib: RuntimeLibrary) => {
        lib.sortedBooks.sort((bId1: number, bId2: number) => {
            return bookPrices[bId2] - bookPrices[bId1]
        })
        lib.score = computeLibraryScore(lib, {bookPrices, libraries, days})
    })
    sortLibraries(libs)

    let result: SignedLibrary[] = []

    let processed = new Set<number>()

    let signupDays = days;

    for (let lib of libs) {
        if (lib.inputLib.signup > signupDays)
            continue
        signupDays -= lib.inputLib.signup
        pushBooks(lib, processed, signupDays)
        result.push(lib.outputLib)
    }

    return result
}
