import { ExecQueueBF } from './ExecQueueBF'
import { ExecCallback } from './types';

let execNum = 0;

export interface ExecQueueTBEvents<QueueEl> {

}

/**
 * TB stand for time batch
 *
 * @export
 * @class ExecQueueTB
 * @extends {ExecQueue<QueueEl>}
 * @template QueueEl
 */

export class ExecQueueTBBF<QueueEl> extends ExecQueueBF<QueueEl> {
    private _autoPauseResume = false;
    private _autoPauseResume_pauseTimeout: number = 500; // default to 0.5s
    private _useAutoResumeByTimeout: boolean = true;
    private _batchSize: number = 500;
    private _chunkToProcessSize: number = 100;
    private _processByChunk: boolean = false;
    private _autoProcessAtBatchSizeWhenReached: boolean = false;
    private _autoAutoAtBatchSizeProcessPauseTimeout = 0;
    private _autoAtBatchSizeProcessIsPausing = false;
    private _batchProcessLock: boolean = false;
    private _autoTimeoutStopped: boolean = true;

    push(el: QueueEl) {
        super.push(el);
    
        //|debug|
        // if (this._queue.length > 0)  {
        //     for (let i = 1; i < this._queue.length; i++) {
        //         if ((this._queue[i] as any).id !== (this._queue[i-1] as any).id + 1) {
        //             console.log('PUSH ============++++> NOT OK NOT OK NOT OK')
        //             console.log({
        //                 0: (this._queue[i-1] as any).id,
        //                 1: (this._queue[i] as any).id
        //             });
        //             // process.exit(0);
        //         }
        //     }
        // }

        this._atPushCheck();

        return this;
    }

    pushMany(els: QueueEl[]) {
        super.pushMany(els);
        this._atPushCheck();
        return this;
    }

    private _atPushCheck() {
        //___________after we push we make run the check for the queue size
        if (!this._batchProcessLock && this._autoPauseResume) {
            if (this._autoProcessAtBatchSizeWhenReached && !this._autoAtBatchSizeProcessIsPausing) {
                this._batchAutoProcessBatchSizeQueueCheck();
            }

            // run only if it work and it was in a sleep mode (paused!!!)
            if (this._useAutoResumeByTimeout && this._autoTimeoutStopped) {
                this._autoTimeoutStopped = false;
                setTimeout(() => {
                    this._automaticBatchProcessWithPause();
                }, this._autoPauseResume_pauseTimeout);
            }
        }
    }



    private _batchAutoProcessBatchSizeQueueCheck() {
        if (
            !this._batchSize || // if NaN (---> this._queue.length)
            this._batchSize <= this._queue.length
        ) {
            this._automaticBatchProcessWithPause();
        }
    }



    /**
     *  Note that pausing will not stop immediately the last running batch processing.
     * It will finish it in all cases.
     * And it will not continue after it.
     * 
     * if you launch the normal resume method. while it haven't finished.
     * 
     * That process will start separately. This will finish it's job, but you have no way to know which one will finish first.
     * 
     * [to think or do]
     * An event that you can listen too or some options like wait to resume. 
     * Or a manual waitFinish() method that you call and will resolve once it happened can be added    
     * 
     */
    pause() {
        super.pause();
        this._autoPauseResume = false;
        return this;
    }

      /**
     * Allow auto pause when the queue get empty
     *
     * @param {number} pauseTimeout
     * @memberof ExecQueue
     */
    autoPauseAndResume(pauseTimeout?: number) {
        if (!pauseTimeout) {
            pauseTimeout = this._autoPauseResume_pauseTimeout;
        }
        this._autoPauseResume = true;
        this._autoPauseResume_pauseTimeout = pauseTimeout;
        super.pause();

        if (this._useAutoResumeByTimeout) {
            this._automaticBatchProcessWithPause();
        }

        return this;
    }


    setUseAutoResumeByTimeout(state: boolean) {
        this._useAutoResumeByTimeout = state;
        console.log({
            useAutResumeByTimeout: this._useAutoResumeByTimeout
        });
        return this;
    }

    /**
     * batch size (the size of element to take on one batch to process them)
     *
     * if the {size} is set to NaN then the whole queue size at that instant will be taken and processed !! (very interesting properties in many usages)
     * 
     * @param {number} size
     * @returns
     * @memberof ExecQueueTB
     */
    setBatchSize(size: number) {
        this._batchSize = size;
        
        return this;
    }

    /**
     * activate or deactivate processing by chunk
     * (one chunk is completely striped from the queue. processed at once and passed to the exec callback)
     * (in place of element one by one)
     *
     * The passed data to the ExecCallback is an array when activated
     * 
     * if no parameter is precised then it will activate the feature (default to true)
     * 
     * however by default at construction it's defaulting to false! 
     * 
     * So to be activated this method need to be called
     * 
     * @param {boolean} processByChunk
     * @returns
     * @memberof ExecQueueTB
     */
    setProcessByChunk(processByChunk: boolean = true) {
        this._processByChunk = processByChunk;
        return this;
    }

    /**
     * the size of the chunk to be striped and processed
     * 
     * if it's set to NaN then it mean you can go up  to the queue length or the batch size
     *
     * @param {number} chunkToProcessSize
     * @returns
     * @memberof ExecQueueTB
     */
    setChunkToProcessSize(chunkToProcessSize: number) {
        this._chunkToProcessSize = chunkToProcessSize;
        return this;
    }

    setPauseTimeOut(pauseTimeout: number) {
        this._autoPauseResume_pauseTimeout = pauseTimeout;
        return this;
    }


    /**
     * The process will be launched automatically when the queue length  reach the batch size. Or more! (the check happen at push)
     * 
     * To activate the feature set it to true (default to true)
     * to deactivate set it to false
     *
     * @memberof ExecQueueTB
     */
    setAutoProcessAtBatchSizeWhenReached(activate: boolean = true) {
        this._autoProcessAtBatchSizeWhenReached = activate;
        return this;
    }

    setAutoAtBatchSizeProcessPauseTimeout(timeout: number) {
        this._autoAutoAtBatchSizeProcessPauseTimeout = timeout;
        return this;
    }


    protected async _batchProcessOneByOne(size: number) {
        if (!size) size = this._queue.length;
        
        for (let i = 0; i < size && this._queue.length > 0; i++) {
            await (this._execCallback as ExecCallback<QueueEl, QueueEl>)(this._queue.shift() as QueueEl, this);
        }
    }

    protected async _batchProcessByChunk(chunkToProcessSize: number, batchSize: number) {
        let processedCount = 0;
        let extractedData: QueueEl[];
        let numberToProcess: number;
        if (!batchSize) batchSize = this._queue.length;
        if(!chunkToProcessSize) chunkToProcessSize = this._queue.length;

        while (processedCount < batchSize && this._queue.length > 0) {
            numberToProcess = Math.min(
                chunkToProcessSize,
                batchSize - processedCount,
                batchSize,
                this._queue.length
            );

            //___extract the exact data
            extractedData = this._queue.splice(0, numberToProcess);
            //________call the execCallback passing the chunk
            
            await (this._execCallback as ExecCallback<QueueEl[], QueueEl>)(extractedData, this);
            
            processedCount += numberToProcess;
        }
    }


    protected async _automaticBatchProcessWithPause() {
        if (!this._batchProcessLock && this._queue.length > 0) {
            this._batchProcessLock = true;

            execNum++;

            if (execNum === 2) {
                console.log('_automaticBatchProcessWithPause ==> NOT OK NOT OK NOT OK');
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log('-------------------------------------')
                console.log({
                    execNum
                })
                // process.exit(0);
            }

            if (this._processByChunk) {
                await this._batchProcessByChunk(this._chunkToProcessSize, this._batchSize);
            } else {
                console.log("------| mmmmmmm |---------->")
                // process.exit(0);
                await this._batchProcessOneByOne(this._batchSize);
            }
            this._batchProcessLock = false;
            execNum--;

            if (this._useAutoResumeByTimeout && this._autoPauseResume && this._queue.length > 0) {
                this._autoTimeoutStopped = false;
                setTimeout(() => {
                    this._automaticBatchProcessWithPause();
                }, this._autoPauseResume_pauseTimeout);
            } else {
                this._autoTimeoutStopped = true;
            }

            if (this._autoProcessAtBatchSizeWhenReached) {
                this._autoAtBatchSizeProcessIsPausing = true;
                setTimeout(() => {
                    this._autoAtBatchSizeProcessIsPausing = false;
                    this._batchAutoProcessBatchSizeQueueCheck();
                }, this._autoAutoAtBatchSizeProcessPauseTimeout);
            }
        }
    }
}



/**
 *  
 *  
 ** About the scheduling or the batching or auto pause feature
 * you can add a scheduling queue. You push to it. The pausing config will be gotten from there. Then if empty, it use the default.
 * Also you can use normal object or callbacks that return that. 
 * 
 * 
 * create a new version of a batching and with chunk processing queue (and only that) 
 * 
 */