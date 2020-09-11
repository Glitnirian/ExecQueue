import { ExecQueue} from './ExecQueue';
import { ExecQueueTBBF} from './ExecQueueTBBF';
import { ExecCallback } from './types';

const data = (() => { let a = []; for(let i = 0; i <= 1000; i++) a.push(i); return a;})();


//_____________________________________________ExecQueueTBBF test


//__________________testing the base functions

test('ExecQueueTBBF-normalProcessing', () => {
    let expectedValue = 0;

    return new Promise((resolve, reject) => {
        const execQueue = new ExecQueueTBBF<number>()
            .bindExecCallback<number>((n: number, execQueueRef) => {
                expect(execQueueRef).toBeInstanceOf(ExecQueueTBBF);
                if (expectedValue !== n) {
                    reject('Wrong matching number !!!!!');
                } else if (expectedValue === n && n === 1000) {
                    resolve();
                }
                expectedValue++;
            })
            .pushMany(data.slice(0, 250))
            .pushMany(data.slice(250, 500));

        setTimeout(() => {
            execQueue
            .pushMany(data.slice(500, 750))
            .pushMany(data.slice(750))
        }, 2000);
    });
});

test('ExecQueueTBBF-normalProcessing+testPauseResume', () => {
    let expectedValue = 0;

    return new Promise((resolve, reject) => {
        let run = false;

        const execQueue = new ExecQueueTBBF<number>()
            .bindExecCallback<number>((n: number, execQueueRef) => {
                run = true;
                if (expectedValue !== n) {
                    reject('Wrong matching number !!!!!');
                } else if (expectedValue === n && n === 1000) {
                    resolve();
                }
                expectedValue++;
            })
            .pause() // pausing need to be before push if you don't want the first run to happen!
        

        setTimeout(() => {
            execQueue.pushMany(data)

            if (run) reject('Run when pausing ! Error'); 

            execQueue.resume();
        }, 2000);
    });
});

test('ExecQueueTBBF-normalProcessing+unshift', () => {
    const firstData = (() => { let a = []; for(let i = -500; i < 0; i++) a.push(i); return a;})();
    
    let expectedValue = -500;

    return new Promise((resolve, reject) => {
        const execQueue = new ExecQueueTBBF<number>()
            .bindExecCallback<number>((n: number, execQueueRef) => {
                if (expectedValue !== n) {
                    reject('Wrong matching number !!!!!');
                } else if (expectedValue === n && n === 1000) {
                    resolve();
                }
                expectedValue++;
            })
            .pause()
            .pushMany(data)
            .unshiftMany(firstData)
            .resume()
    });
});



test('ExecQueueTBBF-normalProcessing+bufferHolder', () => {
    const firstData = (() => { let a = []; for(let i = -500; i < -250; i++) a.push(i); return a;})();
    const secondData = (() => { let a = []; for(let i = -250; i < 0; i++) a.push(i); return a;})();
    const thirdData = (() => { let a = []; for(let i = -1000; i < -500; i++) a.push(i); return a;})();
    
    let expectedValue = -1000;

    return new Promise((resolve, reject) => {
        const execQueue = new ExecQueueTBBF<number>()
            .bindExecCallback<number>((n: number, execQueueRef) => {
                if (expectedValue !== n) {
                    reject('Wrong matching number !!!!!');
                } else if (expectedValue === n && n === 1000) {
                    resolve();
                }
                expectedValue++;
            })
            .pause()
            .pushMany(data);

        setTimeout(() => {
            execQueue.createHoldBuffer('holder') // create first
            execQueue.pushToHoldBuffer('holder', firstData);// push first data to the holder
            setTimeout(() => {
                // pushing a second time to the holder
                execQueue.pushToHoldBuffer('holder', secondData);

                setTimeout(() => {
                    // and again after a time unshifting this time to holdBuffer and then add the whole to the queue and resume the execution 
                    execQueue.unshiftToHoldBuffer('holder', thirdData)
                    .unshiftHoldBufferToQueue('holder')
                    .resume()
                }, 1000);
            }, 1000);
        }, 1000);
    });
});




//______________________________testing specific function (+++)

test('ExecQueueTBBF-testAutoPauseAndResumeWithBatching (And only that) (no chunk processing) (processing is one by one)', () => {
    let expectedValue = 0;

    return new Promise((resolve, reject) => {
        const execQueue = new ExecQueueTBBF<number>()
            .bindExecCallback<number>((n: number, execQueueRef) => {
                if (expectedValue !== n) {
                    reject('Wrong matching number !!!!!');
                } else if (expectedValue === n && n === 1000) {
                    resolve();
                }
                expectedValue++;
            })
            .setBatchSize(100)
            .setPauseTimeOut(300)
            .pause()
            .pushMany(data.slice(0, 250))
            .pushMany(data.slice(250, 500))
            .autoPauseAndResume(); // resume (auto pause resume)

            //___________________testing the timeout
            setTimeout(() => {
                expect(execQueue.getQueue().length).toBe(400);

                setTimeout(() => {
                    expect(execQueue.getQueue().length).toBe(300);

                    setTimeout(() => {
                        expect(execQueue.getQueue().length).toBe(200);

                        setTimeout(() => {
                            expect(execQueue.getQueue().length).toBe(100);
                        }, 305);
                    }, 305);
                }, 305);
            }, 5);
        
        //_________________push at a later time
        setTimeout(() => {
            execQueue
            .pushMany(data.slice(500, 750))
            .pushMany(data.slice(750))
        }, 2000);
    });
}, 15000);

//______________________________testing specific function (+++)

test('ExecQueueTBBF-testAutoPauseAndResumeWithBatchingAndBYChunkProcessing (by chunk processing)', () => {
    const batchSize = 100;
    const timeout = 300;
    const chunkSize = 50;
    const checkPauseTimeout = timeout + timeout / 100;

    let expectedValue = 0;

    return new Promise((resolve, reject) => {
        const execQueue = new ExecQueueTBBF<number>()
            .bindExecCallback<number[]>((chunk: number[], execQueueRef) => {
                expect(chunk.length).toBe(Math.min(chunkSize, batchSize, execQueueRef.getQueue().length + chunk.length));

                for (let n of chunk) {
                    if (expectedValue !== n) {
                        reject('Wrong matching number !!!!! ' + n);
                    } else if (expectedValue === n && n === 1000) {
                        resolve();
                    }
                    expectedValue++;
                }
            })
            .setBatchSize(batchSize)
            .setPauseTimeOut(timeout)
            .setProcessByChunk(true)
            .setChunkToProcessSize(chunkSize)
            .pause()
            .pushMany(data.slice(0, 250))
            .pushMany(data.slice(250, 500))
            .autoPauseAndResume(); // resume (auto pause resume)

            //___________________testing the timeout
            setTimeout(() => {
                expect(execQueue.getQueue().length).toBe(400);

                setTimeout(() => {
                    expect(execQueue.getQueue().length).toBe(300);

                    setTimeout(() => {
                        expect(execQueue.getQueue().length).toBe(200);

                        setTimeout(() => {
                            expect(execQueue.getQueue().length).toBe(100);
                        }, checkPauseTimeout);
                    }, checkPauseTimeout);
                }, checkPauseTimeout);
            }, timeout / 100);
        
        //_________________push at a later time
        setTimeout(() => {
            execQueue
            .pushMany(data.slice(500, 750))
            .pushMany(data.slice(750))
        }, 2000);
    });
}, 15000);






//______________________________testing specific functions (+++)

test('ExecQueueTBBF-testAutoPauseAndResume at Batch size reaching only (without timeout resume) (one by one)', () => {
    const batchSize = 100;
    const halfBatchSize = batchSize / 2;
       
    let expectedValue = 0;

    return new Promise((resolve, reject) => {
        const execQueue = new ExecQueueTBBF<number>()
            .bindExecCallback<number>((n: number, execQueueRef) => {
                if (expectedValue !== n) {
                    reject('Wrong matching number !!!!!');
                } else if (expectedValue === n && n === 1001 - (1001 % batchSize) - 1) {
                    resolve();
                }
                expectedValue++;
            })
            .setBatchSize(batchSize)
            .setUseAutoResumeByTimeout(false) // deactivating timeout resume
            .setAutoProcessAtBatchSizeWhenReached(true)
            .pause()
            .pushMany(data.slice(0, batchSize - halfBatchSize))
            .autoPauseAndResume(); // resume (auto pause resume)

            // batch size not reached so nothing will run
            expect(expectedValue).toBe(0);  

            setTimeout(() => {
                execQueue.pushMany(data.slice(batchSize - halfBatchSize, batchSize + halfBatchSize));

                setTimeout(() => {
                    // we get a size above the batch size (so all the elements up to the batchSize th element. Will be handled )
                    expect(expectedValue).toBe(batchSize);

                    execQueue.pushMany(data.slice(batchSize + halfBatchSize, 3 * batchSize));

                    setTimeout(() => {
                        expect(expectedValue).toBe(3 * batchSize - 1 + 1); // note 2 * batchSize need to be < 1000 (all data size)

                        // push it all
                        execQueue.pushMany(data.slice(3 * batchSize)); // this last one is tested at the last resolving statement of the ExecCallback
                    }, 200);
                }, 200);
            }, 50);
    });
}, 15000);


test('ExecQueueTBBF-testAutoPauseAndResume at Batch size reaching only (without timeout resume) (by chunk processing) (in mean time testing batch size reaching pause timeout)', () => {
    const batchSize = 100;
    const halfBatchSize = batchSize / 2;
    const chunkSize = 50;
    const batchPauseTimeout = 300;

    let expectedValue = 0;

    return new Promise((resolve, reject) => {
        const execQueue = new ExecQueueTBBF<number>()
            .bindExecCallback<number[]>((chunk: number[], execQueueRef) => {
                for (let n of chunk) {
                    if (expectedValue !== n) {
                        reject('Wrong matching number !!!!!');
                    } else if (expectedValue === n && n === 1001 - (1001 % batchSize) - 1) {
                        resolve();
                    }
                    expectedValue++;
                }
            })
            .setBatchSize(batchSize)
            .setUseAutoResumeByTimeout(false) // deactivating timeout resume
            .setAutoProcessAtBatchSizeWhenReached(true)
            .setAutoAtBatchSizeProcessPauseTimeout(batchPauseTimeout)
            .setProcessByChunk(true)
            .setChunkToProcessSize(chunkSize)
            .pause()
            .pushMany(data.slice(0, batchSize - halfBatchSize))
            .autoPauseAndResume(); // resume (auto pause resume)

            // batch size not reached so nothing will run
            expect(expectedValue).toBe(0);  

            setTimeout(() => {
                execQueue.pushMany(data.slice(batchSize - halfBatchSize, batchSize + halfBatchSize));

                setTimeout(() => {
                    // we get a size above the batch size (so all the elements up to the batchSize th element. Will be handled )
                    expect(expectedValue).toBe(batchSize);

                    execQueue.pushMany(data.slice(batchSize + halfBatchSize, 3 * batchSize));

                    setTimeout(() => {
                        expect(expectedValue).toBe(batchSize); // didn't change because of the timeout
                        
                        setTimeout(() => {
                            expect(expectedValue).toBe(2 * batchSize - 1 + 1); // it should change to this (stop again after)
                            setTimeout(() => {
                                expect(expectedValue).toBe(3 * batchSize - 1 + 1); // it should change to this (then stop again)
        
                                // push it all
                                execQueue.pushMany(data.slice(3 * batchSize)); // this last one is tested at the last resolving statement of the ExecCallback
                            }, batchPauseTimeout);
                        }, batchPauseTimeout);
                    }, batchPauseTimeout / 50);
                }, batchPauseTimeout / 50);
            }, batchPauseTimeout / 50);
    });
}, 15000);