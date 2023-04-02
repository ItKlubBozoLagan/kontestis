export type RecurringRecord<K extends keyof any, V> = {
    [k in K]: V | RecurringRecord<K, V>;
};

export type DeepPartial<T> = {
    [k in keyof T]?: T[k] extends {} ? DeepPartial<T[k]> : T[k];
};
