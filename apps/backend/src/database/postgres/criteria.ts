export type EqualityOperation = "in" | "<" | "<=" | ">" | ">=";

export type EqualityExpression<Value> = {
    operation: EqualityOperation;
    values: readonly Value[];
};

export const inArray = <T extends string | number | bigint>(
    ...values: T[]
): EqualityExpression<T> => ({
    operation: "in",
    values,
});

const comparison = <Value>(operation: Exclude<EqualityOperation, "in">, value: Value) =>
    ({
        operation,
        values: [value],
    } as const satisfies EqualityExpression<Value>);

export const lessThan = <Value>(value: Value): EqualityExpression<Value> => comparison("<", value);
export const lessThanOrEqual = <Value>(value: Value): EqualityExpression<Value> =>
    comparison("<=", value);
export const greaterThan = <Value>(value: Value): EqualityExpression<Value> =>
    comparison(">", value);
export const greaterThanOrEqual = <Value>(value: Value): EqualityExpression<Value> =>
    comparison(">=", value);

export const isEqualityExpression = (value: unknown): value is EqualityExpression<unknown> =>
    typeof value === "object" && value !== null && "operation" in value && "values" in value;
