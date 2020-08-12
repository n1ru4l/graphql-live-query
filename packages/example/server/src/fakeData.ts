import * as faker from "faker";

export const createFakeUser = () => ({
  id: faker.random.uuid(),
  name: faker.internet.userName(),
});

export const randomSentence = () => faker.lorem.sentence(10);

export const createFakeMessage = (authorId: string) => ({
  id: faker.random.uuid(),
  authorId,
  content: randomSentence(),
  createdAt: new Date(),
});
