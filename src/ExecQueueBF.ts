import { ExecQueue } from './ExecQueue';
import { HoldBuffers } from './types';

export interface ExecQueueBFEvents {

}

export class ExecQueueBF<QueueEl> extends ExecQueue<QueueEl> {
    protected _holdBuffers: HoldBuffers<QueueEl> = {};

    createHoldBuffer(holdBufferName: string) {
        this._holdBuffers[holdBufferName] = [];
        return this;
    }

    pushToHoldBuffer(holdBufferName: string, el: QueueEl | QueueEl[]) {
        if (Array.isArray(el)) {
            this._holdBuffers[holdBufferName] = this._holdBuffers[holdBufferName].concat(el);
        } else {
            this._holdBuffers[holdBufferName].push(el);
        }
        return this;
    }

    unshiftToHoldBuffer(holdBufferName: string, el: QueueEl | QueueEl[]) {
        if (Array.isArray(el)) {
            this._holdBuffers[holdBufferName] = el.concat(this._holdBuffers[holdBufferName]);
        } else {
            this._holdBuffers[holdBufferName].unshift(el);
        }
        return this;
    }

    removeAllHoldBuffers() {
        this._holdBuffers = {};

        return this;
    }

    removeHoldBuffer(holdBufferName: string) {
        const {[holdBufferName]: remove, ...rest} = this._holdBuffers;
        this._holdBuffers = rest;

        return this;
    }

    /**
     * Push the hold buffer to the queue
     * 
     * by default the holdBuffer will be removed
     * 
     * you can use the second parameter to precise otherwise
     *
     * @param {string} holdBufferName
     * @param {boolean} [remove=true]
     * @memberof ExecQueue
     */
    pushHoldBufferToQueue(holdBufferName: string, remove: boolean = true) {
        this.pushMany(this._holdBuffers[holdBufferName]);
        
        if (remove) {
            this.removeHoldBuffer(holdBufferName);
        }
    }

    /**
     * Unshift the hold buffer to the queue (append at the start)
     * 
     * by default the holdBuffer will be removed
     * 
     * you can use the second parameter to precise otherwise
     * @param holdBufferName 
     * @param remove 
     * @memberof ExecQueue 
     */
    unshiftHoldBufferToQueue(holdBufferName: string, remove: boolean = true) {
        this.unshiftMany(this._holdBuffers[holdBufferName]);
        
        if (remove) {
            this.removeHoldBuffer(holdBufferName);
        }

        return this;
    }

    getHoldBuffer(holdBufferName: string) {
        return this._holdBuffers[holdBufferName];
    }
}
