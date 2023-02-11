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
    const libraryBooks = new Array<Heap<number>>();
    const bookCmp = (b1: number, b2: number) => {
        return bookPrices[b2] - bookPrices[b1];
    };
    for (const lib of libraries) {
        const books = new Heap(bookCmp);
        lib.books.forEach(b => books.push(b));
        libraryBooks.push(books);
    }
    const order = new Array(libraries.length).fill(0).map((_, i) => i).sort(() => Math.random() - 0.5);

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
        if (pendingSignup <= i && res.length < libraries.length) {
            const lib = order[res.length];
            res.push({
                library: lib,
                books: [],
            });
            pendingSignup = i + libraries[lib].signup;
        }
    }

    console.log(res);
    return res;
}
