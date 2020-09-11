import { ExecQueue} from './ExecQueue';
import { ExecQueueTB} from './ExecQueueTB';
import { ExecCallback } from './types';
import { ExecQueueBF } from './ExecQueueBF';

const data = (() => { let a = []; for(let i = 0; i <= 1000; i++) a.push(i); return a;})();

//_____________________________________base ExecQueue test

test('ExecQueue-normalProcessing', () => {
    let expectedValue = 0;

    return new Promise((resolve, reject) => {
        const execQueue = new ExecQueue<number>()
            .bindExecCallback((n: any, execQueueRef) => {
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

test('ExecQueue-normalProcessing+testPauseResume', () => {
    let expectedValue = 0;

    return new Promise((resolve, reject) => {
        let run = false;

        const execQueue = new ExecQueue<number>()
            .bindExecCallback((n: any, execQueueRef) => {
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

test('ExecQueue-normalProcessing+unshift', () => {
    const firstData = (() => { let a = []; for(let i = -500; i < 0; i++) a.push(i); return a;})();
    
    let expectedValue = -500;

    return new Promise((resolve, reject) => {
        const execQueue = new ExecQueue<number>()
            .bindExecCallback((n: any, execQueueRef) => {
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



test('ExecQueue-normalProcessing+bufferHolder', () => {
    const firstData = (() => { let a = []; for(let i = -500; i < -250; i++) a.push(i); return a;})();
    const secondData = (() => { let a = []; for(let i = -250; i < 0; i++) a.push(i); return a;})();
    const thirdData = (() => { let a = []; for(let i = -1000; i < -500; i++) a.push(i); return a;})();
    
    let expectedValue = -1000;

    return new Promise((resolve, reject) => {
        const execQueue = new ExecQueueBF<number>()
            .bindExecCallback((n: any, execQueueRef) => {
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