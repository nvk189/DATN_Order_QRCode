import prisma from '@/database'
import { CreateCategoryBodyType, UpdateCategoryBodyType } from '@/schemaValidations/category.schema'

export const getCategoryList = () => {
  return prisma.category.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })
}
export const getCategoryStatus = () => {
  return prisma.category.findMany({
    where: {
      status: 'Available'
    }
  })
}

export const getCategoryListWithPagination = async (page: number, limit: number) => {
  const data = await prisma.category.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    skip: (page - 1) * limit,
    take: limit
  })
  const totalItem = await prisma.category.count()
  const totalPage = Math.ceil(totalItem / limit)
  return {
    items: data,
    totalItem,
    page,
    limit,
    totalPage
  }
}

export const getCategoryDetail = (id: number) => {
  return prisma.category.findUniqueOrThrow({
    where: {
      id
    }
  })
}

export const createCategory = (data: CreateCategoryBodyType) => {
  const status = data.status ?? 'Available'

  return prisma.category.create({
    data: {
      ...data,
      status: status
    }
  })
}

export const updateCategory = (id: number, data: UpdateCategoryBodyType) => {
  return prisma.category.update({
    where: {
      id
    },
    data
  })
}

export const deleteCategory = (id: number) => {
  return prisma.category.delete({
    where: {
      id
    }
  })
}
