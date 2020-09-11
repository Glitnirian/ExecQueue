import { ExecQueue } from '../ExecQueue';
import { ExecQueueTB } from '../ExecQueueTB';

export type ExecCallback<CallbackQueueEl, QueueEl> = (queueEl: CallbackQueueEl, thisExecQueueRef: ExecQueue<QueueEl> | ExecQueueTB<QueueEl>) => void;

export interface HoldBuffers<QueueEl> {
    [bufferName: string]: QueueEl[]
}
