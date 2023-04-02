export type RecurringRecord<K extends keyof any, V> = {
    [k in K]: V | RecurringRecord<K, V>;
};
