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
        if (remainingBooks == 0)
            break
        if (excludeBooks.has(bookId))
            continue
        res += bookPrices[bookId]
        --remainingBooks
    }

    // return Math.sqrt(res) / lib.inputLib.signup
    return res / lib.inputLib.signup
    // return res / Math.sqrt(lib.inputLib.signup)
}

function computeLibraryScore2(lib: RuntimeLibrary, bookPrices: number[], excludeBooks: Map<number, RuntimeLibrary>, remainingDays: number, bookInfos: BookInfo[]): number {
    let remainingBooks = (remainingDays - lib.inputLib.signup) * lib.inputLib.booksPerDay
    if (remainingBooks <= 0)
        return 0
    
    let res = 0
    let excludeBookPrices: number[] = []
    let booksWhichCanBeRemoved = 0
    for (let bookId of lib.sortedBooks) {
        if (remainingBooks == 0) {
            if (bookInfos[bookId].libs.some(anotherLib => anotherLib.leftBookSlots > 0))
                booksWhichCanBeRemoved++
            excludeBookPrices.push(bookPrices[bookId])
            continue
        }
        if (excludeBooks.has(bookId))
            continue
        res += bookPrices[bookId]
        --remainingBooks
    }

    excludeBookPrices.sort()
    while (booksWhichCanBeRemoved > 0 && excludeBookPrices.length > 0) {
        booksWhichCanBeRemoved--
        res += (excludeBookPrices.pop() as number) * 0.8
    }

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
        if (remainingBooks == 0) {
            lib.leftBooks.push(bookId)
            continue
        }
        lib.outputLib.books.push(bookId)
        --remainingBooks
        processed.set(bookId, lib)
    }

    lib.leftBookSlots = remainingBooks
}

function resortLibraries(libs: RuntimeLibrary[], bookPrices: number[], excludeBooks: Map<number, RuntimeLibrary>, remainingDays: number) {
    libs.forEach((lib: RuntimeLibrary) => {
        lib.score = computeLibraryScore(lib, bookPrices, excludeBooks, remainingDays)
    })
    libs.sort((l1: RuntimeLibrary, l2: RuntimeLibrary) => {
        return l1.score - l2.score
    })
}

function resortLibraries2(libs: RuntimeLibrary[], bookPrices: number[], excludeBooks: Map<number, RuntimeLibrary>, remainingDays: number, bookInfos: BookInfo[]) {
    libs.forEach((lib: RuntimeLibrary) => {
        lib.score = computeLibraryScore2(lib, bookPrices, excludeBooks, remainingDays, bookInfos)
    })
    libs.sort((l1: RuntimeLibrary, l2: RuntimeLibrary) => {
        return l1.score - l2.score
    })
}

function improveSolution(libs: RuntimeLibrary[], { bookPrices, libraries, days }: InputData, processed: Map<number, RuntimeLibrary>, bookInfos: BookInfo[]) {
    for (let lib of libs) {
        let numLeftBooks = lib.leftBooks.map(bookId => (processed.has(bookId) ? 0 : 1) as number).reduce((prev, cur) => prev + cur, 0);
        let freedSlots = 0

        lib.outputLib.books.sort((b1: number, b2: number) => {
            return bookInfos[b2].libs.length - bookInfos[b1].libs.length
        })

        let newResBooks: number[] = []
        for (let i = 0; i < lib.outputLib.books.length; i++) {
            let bookId = lib.outputLib.books[i]
            if (freedSlots >= numLeftBooks) {
                newResBooks.push(bookId)
                continue
            }
            let bestNewLib: RuntimeLibrary | null = null
            for (let possibleLib of bookInfos[bookId].libs) {
                if (possibleLib == lib)
                    continue
                if (possibleLib.leftBookSlots <= 0)
                    continue
                if (!bestNewLib || bestNewLib.leftBookSlots < possibleLib.leftBookSlots)
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

    let result: SignedLibrary[] = []

    let signupDays = days;

    let libNumSqrt = Math.round(Math.pow(libraries.length, 0.4))

    let activeLibs = [...libs]
    resortLibraries(activeLibs, bookPrices, processed, days)
    let i = 0
    while (activeLibs.length > 0) {
        ++i
        if (i % libNumSqrt == 0) {
            resortLibraries(activeLibs, bookPrices, processed, signupDays)
            // resortLibraries2(activeLibs, bookPrices, processed, signupDays, bookInfos)
            // else 
        }

        let lib = activeLibs.pop() as RuntimeLibrary
        if (lib.inputLib.signup > signupDays)
            continue

        signupDays -= lib.inputLib.signup
        pushBooks(lib, processed, signupDays)
        result.push(lib.outputLib)
    }

    improveSolution(libs, { bookPrices, libraries, days }, processed, bookInfos)

    return result
}
