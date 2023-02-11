import Heap from "heap";
import { InputData, OutputData, SignedLibrary } from "../types";

export const solve = ({
    bookPrices,
    libraries,
    days,
}: InputData): OutputData => {
    let pendingSignup = 0;
    let res = Array<SignedLibrary>();
    const processedBooks = new Set<number>();
    const potentialBooks = new Set<number>();

    const libraryBooks = new Array<Heap<number>>();
    const bookCmp = (b1: number, b2: number) => {
        return bookPrices[b2] - bookPrices[b1];
    };
    for (const lib of libraries) {
        const books = new Heap(bookCmp);
        lib.books.forEach(b => books.push(b));
        libraryBooks.push(books);
    }
    const libraryScore = (index: number, curDay: number): [number, Array<number>] => {
        const library = libraries[index];
        const books = library.books
            .filter(bookId => !potentialBooks.has(bookId))
            .map(bookId => ({price: bookPrices[bookId], index: bookId}))
            .sort((a, b) => b.price - a.price);
        const daysLeft = Math.max(days - curDay - library.signup, 0);
        const booksTakenAmount = daysLeft * library.booksPerDay;
        const booksTaken = books.slice(0, booksTakenAmount);
        const score = booksTaken.reduce((sum, val) => sum + val.price, 0);
        return [score / library.signup, booksTaken.map(({index}) => index)];
    }
    type ScoredOrder = {
        index: number;
        score: number;
    }
    const order = new Heap<ScoredOrder>((a, b) => b.score - a.score);
    for (let i = 0; i < libraries.length; i += 1) {
        order.push({
            index: i,
            score: libraryScore(i, 0)[0],
        });
    }

    for (let i = 0; i < days; i++) {
        for (let l = 0; l < res.length - (pendingSignup <= i ? 0 : 1); l++) {
            const lib = res[l];
            const library = libraries[lib.library];
            for (let j = 0; j < library.booksPerDay; j++) {
                let book;
                while (true) {
                    book = libraryBooks[lib.library].pop();
                    if (book === undefined) {
                        break;
                    }
                    if (processedBooks.has(book)) {
                        continue;
                    }
                    break;
                }
                if (book === undefined) {
                    break;
                }
                processedBooks.add(book);
                lib.books.push(book);
            }
        }
        if (pendingSignup <= i) {
            let lib: ScoredOrder | undefined;
            let books: Array<number> = [];
            while (true) {
                lib = order.pop();
                if (!lib) {
                    break;
                }
                const [score, booksTaken] = libraryScore(lib.index, i);
                if (score !== lib.score) {
                    lib.score = score;
                    order.push(lib);
                }
                books = booksTaken;
                break;
            }
            if (lib) {
                res.push({
                    library: lib.index,
                    books: [],
                });
                pendingSignup = i + libraries[lib.index].signup;
                for (const bookId of books) {
                    potentialBooks.add(bookId);
                }
            }
        }
    }

    return res;
}
