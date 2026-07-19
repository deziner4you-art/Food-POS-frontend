export class PostingCompletedEvent {
  constructor(
    public readonly storeId: number,
    public readonly journalEntryId: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}
