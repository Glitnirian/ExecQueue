

export enum IPromiseState {
    Pending = 0,
    Resolved = 1,
    Rejected = 1
} 

export class PromiseFiber {
    public promise: Promise<any>;
    private _resolve: Function;
    private _reject: Function;
    private _state: IPromiseState;

    constructor() {
        this._state = IPromiseState.Pending;

        this.promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    public resolve() {
        this._state = IPromiseState.Resolved;
        this._resolve();
        return this;
    }

    public reject() {
        this._state = IPromiseState.Rejected;
        this._reject();
        return this;
    }


    public await(): Promise<any> {
        return this.promise;
    };

    public getState() {
        return this._state;
    }
}
