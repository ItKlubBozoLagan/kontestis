export const mapFields = <
    T extends Record<string, unknown>,
    K extends keyof T,
    R
>(
    data: T,
    fields: K[],
    mapper: (it: T[K]) => R
): { [k in keyof T]: k extends K ? R : T[k] } => {
    return Object.assign(
        {},
        ...Object.entries(data).map(([k, v]) =>
            fields.includes(k as K) ? { [k]: mapper(v as T[K]) } : { [k]: v }
        )
    );
};
