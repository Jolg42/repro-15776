import { PrismaClient } from "@prisma/client";

describe("MongoDB", () => {
  let prisma: PrismaClient;
  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const prismaPromises = [
      prisma.postManyToMany.deleteMany(),
      prisma.categoryManyToMany.deleteMany(),
    ];
    await prisma.$transaction(prismaPromises);
  });

  // m:n relation (MongoDB database)
  async function createXPostsWith2CategoriesMongoDB({
    count,
  }: {
    count: number;
  }) {
    const prismaPromises: any = [];

    for (let i = 0; i < count; i++) {
      // We want to start at 1
      const id = (i + 1).toString();
      // @ts-ignore
      const prismaPromise = prisma.postManyToMany.create({
        data: {
          id: id,
          categories: {
            create: [
              {
                id: `${id}-cat-a`,
              },
              {
                id: `${id}-cat-b`,
              },
            ],
          },
        },
        include: {
          categories: true,
        },
      });
      prismaPromises.push(prismaPromise);
    }

    return await prisma.$transaction(prismaPromises);
  }

  test("[create] create post [nested] [create] categories [nested] [create] category should succeed", async () => {
    await prisma.postManyToMany.create({
      data: {
        id: "1",
        categories: {
          create: [
            {
              id: "1",
            },
          ],
        },
      },
    });

    expect(
      await prisma.postManyToMany.findMany({ orderBy: { id: "asc" } })
    ).toEqual([
      {
        id: "1",
        categoryIDs: ["1"],
        published: null,
      },
    ]);
    expect(await prisma.categoryManyToMany.findMany()).toEqual([
      {
        id: "1",
        postIDs: ["1"],
        published: null,
      },
    ]);
  });

  test("[update] (post) optional boolean field should succeed", async () => {
    await createXPostsWith2CategoriesMongoDB({
      count: 2,
    });

    await prisma.postManyToMany.update({
      where: {
        id: "1",
      },
      data: {
        published: true,
      },
    });

    expect(
      await prisma.postManyToMany.findMany({ orderBy: { id: "asc" } })
    ).toEqual([
      {
        id: "1",
        // The update
        published: true,
        categoryIDs: ["1-cat-a", "1-cat-b"],
      },
      {
        id: "2",
        published: null,
        categoryIDs: ["2-cat-a", "2-cat-b"],
      },
    ]);
    expect(
      await prisma.categoryManyToMany.findMany({
        orderBy: { id: "asc" },
      })
    ).toEqual([
      {
        id: "1-cat-a",
        published: null,
        postIDs: ["1"],
      },
      {
        id: "1-cat-b",
        published: null,
        postIDs: ["1"],
      },
      {
        id: "2-cat-a",
        published: null,
        postIDs: ["2"],
      },
      {
        id: "2-cat-b",
        published: null,
        postIDs: ["2"],
      },
    ]);
  });

  test("[delete] post should succeed", async () => {
    await createXPostsWith2CategoriesMongoDB({
      count: 2,
    });

    await prisma.postManyToMany.delete({
      where: { id: "1" },
    });

    expect(
      await prisma.postManyToMany.findMany({ orderBy: { id: "asc" } })
    ).toEqual([
      {
        id: "2",
        categoryIDs: ["2-cat-a", "2-cat-b"],
        published: null,
      },
    ]);

    expect(
      await prisma.categoryManyToMany.findMany({
        orderBy: { id: "asc" },
      })
    ).toEqual([
      {
        id: "1-cat-a",
        postIDs: ["1"],
        published: null,
      },
      {
        id: "1-cat-b",
        postIDs: ["1"],
        published: null,
      },
      {
        id: "2-cat-a",
        postIDs: ["2"],
        published: null,
      },
      {
        id: "2-cat-b",
        postIDs: ["2"],
        published: null,
      },
    ]);
  });
});
