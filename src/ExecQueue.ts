import { ExecCallback, HoldBuffers } from './types';
import { Hooks } from 'hooksi';

let resultId = 0;

export interface IExecQueueEvents<QueueEl> {
    queueProcessed: () => void,
    elementProcessed: (processedEl: QueueEl) => void
}


export interface ExecQueueOptions {
    multiProcessingNumber?: number,
}

export class ExecQueue<QueueEl> {
    protected _queue: QueueEl[] = [];
    protected _pause: boolean = false;
    protected _execCallback?: ExecCallback<any, QueueEl>;
    protected _lastQueueLength: number = 0;
    protected _multiProcessingNumber: number;
    protected _inProcessingNumber: number = 0;
    protected _hooks: Hooks<IExecQueueEvents<QueueEl>>;
    private _isQueueProcessedHookExecuting: boolean = false;

    constructor(options?: ExecQueueOptions) {
        options = options || {};
        this._multiProcessingNumber = options.multiProcessingNumber || 1;
        this._hooks = new Hooks();
    }

    public bindExecCallback<CallbackQueueEl = QueueEl>(callback: ExecCallback<CallbackQueueEl, QueueEl>) {
        this._execCallback = callback;
        return this;
    }

    public getQueue() {
        return this._queue;
    }

    public getEl(index: number) {
        if (index < 0) index = this._queue.length + index;
        return this._queue[index];
    }

    public push(el: QueueEl) {
        this._queue.push(el);
        this._process();

        return this;
    }

    public pushMany(els: QueueEl[]) {
        this._queue = this._queue.concat(els);
        this._process();
        
        return this;
    }

    public unshift(el: QueueEl) {
        this._queue.unshift(el);
        this._process();
        return this;
    }

    public unshiftMany(els: QueueEl[]) {
        this._queue = els.concat(this._queue);
        this._process();
        return this;
    }

    public pause () {
        this._pause = true;
        return this;
    }

    public resume() {
        this._pause = false;
        this._process();
        return this;
    }

    public setQueue(queue: QueueEl[]) {
        this._queue = queue;
        this._process();
        return this;
    }

    public isPausing() {
        return this._pause;
    }

    protected async _process() {
        if (this._queue.length > 0) {
            if (this._isQueueProcessedHookExecuting) {
                return;
            }

            if (!this._pause && this._inProcessingNumber < this._multiProcessingNumber) {
                this._lastQueueLength = this._queue.length;

                for (let i = 0; i < this._multiProcessingNumber - this._inProcessingNumber; i++) {
                    this._inProcessingNumber++;
                    const elToProcess = this._queue.shift() as QueueEl;
                    const execResult = (this._execCallback as ExecCallback<QueueEl, QueueEl>)(elToProcess, this);

                    resultId++;

                    Promise.resolve(execResult)
                    .then(async () => { // TODO: logic reverification
                        this._inProcessingNumber--;
                        await this._hooks.execAsync('elementProcessed', this, elToProcess);
                        this._process();
                    });
                }
            }
        } else {
            /**
             * processing finished
             */

            if (this._lastQueueLength > 0) {
                this._lastQueueLength = 0;
                this._isQueueProcessedHookExecuting = true;
                await this._hooks.execAsync('queueProcessed', this);
                this._isQueueProcessedHookExecuting = false;
            }
        }
    }

    public on(eventName: keyof IExecQueueEvents<QueueEl>, callback: IExecQueueEvents<QueueEl>[typeof eventName]) {
        this._hooks.on(eventName, callback);
    }
}


/**
 * You may add conditional check before processing if you like (later)
 *
 *
 * OUT OF THIS MODULE!!!
 * =====================
 * Later see the alternative or the options that we can have to have parallel processing queue (not talking about asynchronous! Cause we can do that with the callback.) But complete parallelism. In node js it's possible either with the new threads api. Or by forking processes. Cool things can be made. What about some easy helper that automatically get remote like, does electron !!!!!
 * any way !!!! just saying !!!!!
 *
 */


 /**
  * TODO: Multi processing test !!!!!!!
  */
