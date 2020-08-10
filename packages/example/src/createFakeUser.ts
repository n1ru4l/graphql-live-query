import * as faker from "faker";

export const createFakeUser = () => ({
  id: faker.random.uuid(),
  name: faker.internet.userName(),
});
