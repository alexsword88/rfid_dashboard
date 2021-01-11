export class HistoryTime {
  private historyRange = -10;
  private avgTrigger = -7;
  private history: Date[] = [];

  constructor(historyRange: number = -10) {
    if (historyRange) {
      this.historyRange =
        Math.abs(Math.trunc(historyRange) || this.historyRange) * -1;
      this.avgTrigger = Math.round(this.historyRange * -1 * 0.7);
    }
  }

  get firstTime(): number {
    return this.history.length > 0 ? this.history[0].getTime() : undefined;
  }

  get lastTime(): number {
    return this.history.length > 0
      ? this.history[this.history.length - 1].getTime()
      : undefined;
  }

  public addDate(date: Date): void {
    if (date) {
      this.history.push(date);
      this.history = this.history.slice(this.historyRange);
    }
  }

  get avgTime(): number {
    if (this.history.length > this.avgTrigger) {
      const timeNow = new Date().getTime();
      const total = this.history
        .map((recordDate) => Math.abs(timeNow - recordDate.getTime()))
        .reduce((a, b) => a + b);
      return total / this.history.length;
    }
    return Number.MAX_VALUE;
  }
}
