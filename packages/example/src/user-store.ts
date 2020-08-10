type User = {
  id: string;
  name: string;
};

const randomInt = (max: number) => Math.floor(Math.random() * max) + 1;

export class UserStore {
  private _users: User[] = [];

  getAll() {
    return this._users;
  }

  getRandom(): User | null {
    return this._users[randomInt(this._users.length) - 1] || null;
  }

  add(user: User) {
    this._users.push(user);
  }
}
