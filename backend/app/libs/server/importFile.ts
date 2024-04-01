import { getImages } from "./getImages";
import type {
  Category,
  FireStore,
  Post,
  PrismaClient,
  System,
  User,
} from "@prisma/client";

type DataType = {
  users: User[];
  categories: Category[];
  system: System[];
  posts: (Post & { categories: { id: string }[] })[];
  files: (FireStore & { binary: string })[];
};

export const importFile = async ({
  prisma,
  file,
}: {
  prisma: PrismaClient;
  file: string;
}) => {
  const data: DataType = JSON.parse(file);
  if (data) {
    console.log("deleteMany");
    await prisma.post.deleteMany().catch(console.error);
    await prisma.category.deleteMany().catch(console.error);
    await prisma.system.deleteMany().catch(console.error);
    await prisma.fireStore.deleteMany().catch(console.error);
    await prisma.user.deleteMany().catch(console.error);
    console.log("user upsert");
    await Promise.all(
      data.users.map((value) =>
        prisma.user.upsert({
          create: value,
          update: value,
          where: { id: value.id },
        })
      )
    ).catch(console.error);
    console.log("files upsert");
    await Promise.all(
      data.files.map((value) =>
        prisma.fireStore.upsert({
          create: value,
          update: value,
          where: { id: value.id },
        })
      )
    ).catch(console.error);
    console.log("system upsert");
    await prisma.system.upsert({
      create: data.system[0],
      update: data.system[0],
      where: { id: "system" },
    });
    console.log("category upsert");
    await Promise.all(
      data.categories.map((value) =>
        prisma.category.upsert({
          create: value,
          update: value,
          where: { id: value.id },
        })
      )
    ).catch(console.error);
    const ids = new Set(
      (await prisma.fireStore.findMany()).map(({ id }) => id)
    );

    // const imageList = Object.fromEntries(
    //   await Promise.all(
    //     data.posts.map(async (value) => {
    //       const images = await getImages(value.content);
    //       return [value.id, images] as const;
    //     })
    //   )
    // );
    console.log("create post");
    const transaction = data.posts.map(async (value) => {
      const { categories, ...post } = value;
      await prisma.post.upsert({
        create: post,
        update: post,
        where: { id: value.id },
      });
      // const images = imageList[value.id];
      // const connectImages = images.filter((v) => ids.has(v));

      await prisma.post.update({
        data: {
          // postFiles: { connect: connectImages.map((id) => ({ id })) },
          categories: { connect: categories.map((id) => id) },
        },
        where: { id: value.id },
      });
    });
    await Promise.all(transaction).catch(console.error);
  }
};
