export abstract class EQ_Base<QueueEl> {
    abstract push(el: QueueEl | QueueEl[]): EQ_Base<QueueEl>;
    abstract unshift(el: QueueEl | QueueEl[]): EQ_Base<QueueEl>;
    abstract shift(el: QueueEl | QueueEl): EQ_Base<QueueEl>;
}
