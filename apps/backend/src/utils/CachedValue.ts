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

    async get(...parameters: Parameters) {
        if (!this.value || Date.now() - this.lastUpdate > this.timeout) {
            const value = await this.getter(...parameters);

            this.value = value;
            this.lastUpdate = Date.now();

            return value;
        }

        return this.value;
    }
}
