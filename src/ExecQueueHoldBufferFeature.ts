import { HoldBuffers } from "./types";
import { EQ_Base } from "./Base";

export abstract class EQ_HoldBuffer<QueueEl, ExtendingClass> extends EQ_Base<QueueEl>{
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
        this.push(this._holdBuffers[holdBufferName]);
        
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
        this.unshift(this._holdBuffers[holdBufferName]);
        
        if (remove) {
            this.removeHoldBuffer(holdBufferName);
        }

        return this;
    }

    getHoldBuffer(holdBufferName: string) {
        return this._holdBuffers[holdBufferName];
    }
}