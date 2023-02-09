export const mapFields = <T extends Record<string, unknown>, K extends keyof T, R>(
    data: T,
    fields: K[],
    mapper: (_: T[K]) => R
): { [k in keyof T]: k extends K ? R : T[k] } => {
    return Object.assign(
        {},
        ...Object.entries(data).map(([k, v]) =>
            fields.includes(k as K) ? { [k]: mapper(v as T[K]) } : { [k]: v }
        )
    );
};

export const filterAsync = async <T>(
    data: T[],
    predicate: (it: T, index: number, source: T[]) => boolean | Promise<boolean>
): Promise<T[]> => {
    return Promise.all(
        data.map(async (it, index, array) => [it, await predicate(it, index, array)] as const)
    ).then((resolved) => resolved.filter(([_, condition]) => condition).map(([value]) => value));
};
