export type InputData = {
    bookPrices: Array<number>;
    libraries: Array<Library>;
    days: number;
};

export type Library = {
    books: Array<number>;
    signup: number;
    booksPerDay: number;
};

export type SignedLibrary = {
    library: number;
    books: Array<number>;
};

export type OutputData = Array<SignedLibrary>;

export type Solution = (input: InputData) => OutputData;