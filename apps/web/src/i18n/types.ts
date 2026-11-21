/** Same shape as the English source, with every leaf widened to `string`. */
export type Translation<T> = {
    [K in keyof T]?: T[K] extends string ? string : Translation<T[K]>;
};
