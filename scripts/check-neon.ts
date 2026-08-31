import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    take: 5,
    orderBy: { updatedAt: 'desc' },
    select: {
      name: true,
      ean: true,
      imageUrl: true,
      frontImageUrl: true,
      frontSmallImageUrl: true,
      packagingImageUrl: true,
      packageQuantity: true,
      nutritionalInfo: {
        select: {
          caffeineMg: true,
          vitaminsList: true,
          nutritionImageUrl: true,
        },
      },
    },
  });

  console.log('\n================ RESULTADOS EN NEON DB ================');
  console.log(JSON.stringify(products, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
