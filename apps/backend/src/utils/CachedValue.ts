type AnyFunctionReturning<T, Parameters extends unknown[] = []> =
    | ((...parameters: Parameters) => T)
    | ((...parameters: Parameters) => Promise<T>);

export class CachedValue<T, Parameters extends unknown[] = []> {
    private lastUpdate: number;
    private value: T | undefined;
    private readonly getter: AnyFunctionReturning<T, Parameters>;
    private readonly timeout: number;

    constructor(getter: AnyFunctionReturning<T, Parameters>, timeout: number) {
        this.getter = getter;
        this.timeout = timeout;
        this.lastUpdate = 0;
    }

    // force cast to promise
    async #callGetter(...paramaters: Parameters): Promise<T> {
        return this.getter(...paramaters);
    }

    async get(...parameters: Parameters) {
        if (!this.value || Date.now() - this.lastUpdate > this.timeout) {
            const refresh = this.#callGetter(...parameters).then((value) => {
                this.value = value;
                this.lastUpdate = Date.now();

                return value;
            });

            if (!this.value) return await refresh;

            return this.value;
        }

        return this.value;
    }
}
