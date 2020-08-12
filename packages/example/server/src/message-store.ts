type Message = {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
};

export class MessageStore {
  private _messages: Message[] = [];

  getAll() {
    return this._messages;
  }

  add(message: Message) {
    this._messages.push(message);
  }

  getLast(): Message | null {
    return this._messages[this._messages.length - 1] || null;
  }
}
