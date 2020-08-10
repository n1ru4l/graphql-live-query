import * as faker from "faker";

export const createFakeUser = () => ({
  id: faker.random.uuid(),
  name: faker.internet.userName(),
});

export const createFakeMessage = (authorId: string) => ({
  id: faker.random.uuid(),
  authorId,
  content: faker.random.words(10),
  createdAt: new Date(),
});
