# Objects helpers

Exec queue tool set

## ExecQueue


### init

Notice how to bind an exec callback

```ts
this._requestsCallsQueue = new ExecQueue<CallsQueueEl>()
    .bindExecCallback(async (el) => {
        return this._handleRequestsQueueCall(el);
    });
```

#### exec callback signature
```ts
type ExecCallback<CallbackQueueEl, QueueEl> = (queueEl: CallbackQueueEl, thisExecQueueRef: ExecQueue<QueueEl> | ExecQueueTB<QueueEl>) => void;
```

### push to queue
```ts
this._requestsCallsQueue.push({
    methodName,
    originMethod,
    args,
    isOrderMethod,
    ordersRequestsLimitsList,
    requestsLimitsList,
    resolve,
    reject
});

this._requestsCallsQueue.pushMany([...els]);
```

### unshift

```ts
this._requestsCallsQueue.unshift(el);

this._requestsCallsQueue.unshiftMany([...els]);
```


### Pause

```ts
this._requestsCallsQueue.pause();
```

### resume
```ts
this._requestsCallsQueue.resume();
```

### getQueue

```ts
this._requestsCallsQueue.getQueue().length
```


### Events
```ts
export interface ExecQueueEvents<QueueEl> {
    queueProcessed: () => void,
    elementProcessed: (processedEl: QueueEl) => void
}
```