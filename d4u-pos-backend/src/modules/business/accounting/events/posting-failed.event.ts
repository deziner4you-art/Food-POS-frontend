export class PostingFailedEvent {
  constructor(
    public readonly storeId: number,
    public readonly journalEntryId: number,
    public readonly reason: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
