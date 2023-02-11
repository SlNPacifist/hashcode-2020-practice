import { InputData, Library, SignedLibrary, OutputData } from "../types";

type RuntimeLibrary = {
    id: number;
    inputLib: Library;
    outputLib: SignedLibrary;
    sortedBooks: number[];
    score: number;
    leftBooks: number[];
    leftBookSlots: number;
};

type BookInfo = {
    id: number;
    price: number;
    libs: RuntimeLibrary[];
};

function computeLibraryScore(lib: RuntimeLibrary, bookPrices: number[], excludeBooks: Map<number, RuntimeLibrary>, remainingDays: number): number {
    let remainingBooks = (remainingDays - lib.inputLib.signup) * lib.inputLib.booksPerDay
    if (remainingBooks <= 0)
        return 0
    
    let res = 0
    for (let bookId of lib.sortedBooks) {
        if (remainingBooks == 0) {
            lib.leftBooks.push(bookId)
            continue
        }
        if (excludeBooks.has(bookId))
            continue
        res += bookPrices[bookId]
        --remainingBooks
    }

    lib.leftBookSlots = remainingBooks

    // return Math.sqrt(res) / lib.inputLib.signup
    return res / lib.inputLib.signup
    // return res / Math.sqrt(lib.inputLib.signup)
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
        score: 0,
        leftBooks: [],
        leftBookSlots: 0
    }
    
    return res
}

function pushBooks(lib: RuntimeLibrary, processed: Map<number, RuntimeLibrary>, remainingDays: number) {
    let remainingBooks = remainingDays * lib.inputLib.booksPerDay
    for (let bookId of lib.sortedBooks) {
        if (processed.has(bookId))
            continue
        if (remainingBooks == 0)
            break
        lib.outputLib.books.push(bookId)
        --remainingBooks
        processed.set(bookId, lib)
    }
}

function sortLibraries(libs: RuntimeLibrary[]): void {
    libs.sort((l1: RuntimeLibrary, l2: RuntimeLibrary) => {
        return l1.score - l2.score
    })
}

function resortLibraries(libs: RuntimeLibrary[], bookPrices: number[], excludeBooks: Map<number, RuntimeLibrary>, remainingDays: number) {
    libs.forEach((lib: RuntimeLibrary) => {
        lib.score = computeLibraryScore(lib, bookPrices, excludeBooks, remainingDays)
    })
    sortLibraries(libs)
}

function improveSolution(libs: RuntimeLibrary[], { bookPrices, libraries, days }: InputData, processed: Map<number, RuntimeLibrary>) {
    let bookInfos: BookInfo[] = bookPrices.map((price, id) => {
        return {
            id: id,
            price: price,
            libs: []
        }
    })
    libs.forEach(lib => {
        lib.inputLib.books.forEach(bookId => {
            bookInfos[bookId].libs.push(lib)
        })
    })

    for (let lib of libs) {
        let numLeftBooks = lib.leftBooks.map(bookId => (processed.has(bookId) ? 0 : 1) as number).reduce((prev, cur) => prev + cur, 0);
        let freedSlots = 0

        let newResBooks: number[] = []
        for (let i = 0; i < lib.outputLib.books.length; i++) {
            let bookId = lib.outputLib.books[i]
            if (freedSlots >= numLeftBooks) {
                newResBooks.push(bookId)
                continue
            }
            let bestNewLib: RuntimeLibrary | null = null
            // TODO sort possibleLibs somehow
            for (let possibleLib of bookInfos[bookId].libs) {
                if (possibleLib == lib)
                    continue
                if (possibleLib.leftBookSlots == 0)
                    continue
                if (!bestNewLib || bestNewLib.leftBookSlots > possibleLib.leftBookSlots)
                    bestNewLib = possibleLib
            }
            if (bestNewLib) {
                ++freedSlots
                --bestNewLib.leftBookSlots
                bestNewLib.outputLib.books.push(bookId)
                processed.set(bookId, bestNewLib)
            } else {
                newResBooks.push(bookId)
            }
        }

        let improved = 0
        for (let bookId of lib.leftBooks) {
            if (freedSlots <= 0)
                break;
            if (processed.has(bookId))
                continue
            --freedSlots
            processed.set(bookId, lib)
            newResBooks.push(bookId)
            improved++
        }

        lib.outputLib.books = newResBooks
    }
}

export const solve = ({ bookPrices, libraries, days }: InputData): OutputData => {
    let libs: RuntimeLibrary[] = libraries.map((l: Library, id: number) => makeRuntimeLibrary(id, l))
    let processed = new Map<number, RuntimeLibrary>()
    libs.forEach((lib: RuntimeLibrary) => {
        lib.sortedBooks.sort((bId1: number, bId2: number) => {
            return bookPrices[bId2] - bookPrices[bId1]
        })
    })

    let result: SignedLibrary[] = []

    let signupDays = days;

    let libNumSqrt = Math.round(Math.sqrt(libraries.length))

    let activeLibs = [...libs]
    resortLibraries(activeLibs, bookPrices, processed, days)
    let i = 0
    while (activeLibs.length > 0) {
        ++i
        if (i % libNumSqrt == 0) {
            resortLibraries(activeLibs, bookPrices, processed, signupDays)
        }

        // if (Math.random() < Math.min(0.01, 1 / Math.pow(libs.length, 1.7)) && activeLibs.length > 3) {
        //     let t = activeLibs[0]
        //     activeLibs[0] = activeLibs.pop() as RuntimeLibrary
        //     activeLibs.push(t)
        //     continue
        // }

        let lib = activeLibs.pop() as RuntimeLibrary
        if (lib.inputLib.signup > signupDays)
            continue

        signupDays -= lib.inputLib.signup
        pushBooks(lib, processed, signupDays)
        result.push(lib.outputLib)
    }

    improveSolution(libs, { bookPrices, libraries, days }, processed)

    return result
}
