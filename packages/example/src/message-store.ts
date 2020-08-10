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
}
