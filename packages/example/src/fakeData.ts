import * as faker from "faker";

export const createFakeUser = () => ({
  id: faker.random.uuid(),
  name: faker.internet.userName(),
});

export const createFakeMessage = (authorId: string) => ({
  id: faker.random.uuid(),
  authorId,
  content: faker.lorem.sentence(10),
  createdAt: new Date(),
});
