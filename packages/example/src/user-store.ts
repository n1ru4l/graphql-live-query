type User = {
  id: string;
  name: string;
};

export class UserStore {
  private _users: User[] = [];

  getUsers() {
    return this._users;
  }

  add(user: User) {
    this._users.unshift(user);
  }
}
