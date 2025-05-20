import {
  createCategory,
  deleteCategory,
  getCategoryDetail,
  getCategoryList,
  getCategoryStatus,
  getCategoryListWithPagination,
  updateCategory
} from '@/controllers/category.controller'
import { pauseApiHook, requireEmployeeHook, requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import {
  CreateCategoryBody,
  CreateCategoryBodyType,
  CategoryListRes,
  CategoryListResType,
  CategoryListWithPaginationQuery,
  CategoryListWithPaginationQueryType,
  CategoryListWithPaginationRes,
  CategoryListWithPaginationResType,
  CategoryParams,
  CategoryParamsType,
  CategoryRes,
  CategoryResType,
  UpdateCategoryBody,
  UpdateCategoryBodyType
} from '@/schemaValidations/category.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function categoryRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get<{
    Reply: CategoryListResType
  }>(
    '/',
    {
      schema: {
        response: {
          200: CategoryListRes
        }
      }
    },
    async (request, reply) => {
      const dishs = await getCategoryList()
      reply.send({
        data: dishs as CategoryListResType['data'],
        message: 'Lấy danh sách danh mục món ăn thành công!'
      })
    }
  )
  fastify.get<{
    Reply: CategoryListResType
  }>(
    '/status',
    {
      schema: {
        response: {
          200: CategoryListRes
        }
      }
    },
    async (request, reply) => {
      const dishs = await getCategoryStatus()
      reply.send({
        data: dishs as CategoryListResType['data'],
        message: 'Lấy trạng thái danh sách danh mục món ăn thành công!'
      })
    }
  )

  fastify.get<{
    Reply: CategoryListWithPaginationResType
    Querystring: CategoryListWithPaginationQueryType
  }>(
    '/pagination',
    {
      schema: {
        response: {
          200: CategoryListWithPaginationRes
        },
        querystring: CategoryListWithPaginationQuery
      }
    },
    async (request, reply) => {
      const { page, limit } = request.query
      const data = await getCategoryListWithPagination(page, limit)
      reply.send({
        data: {
          items: data.items as CategoryListWithPaginationResType['data']['items'],
          totalItem: data.totalItem,
          totalPage: data.totalPage,
          page,
          limit
        },
        message: 'Lấy danh sách danh mục món ăn thành công!'
      })
    }
  )

  fastify.get<{
    Params: CategoryParamsType
    Reply: CategoryResType
  }>(
    '/:id',
    {
      schema: {
        params: CategoryParams,
        response: {
          200: CategoryRes
        }
      }
    },
    async (request, reply) => {
      const dish = await getCategoryDetail(request.params.id)
      reply.send({
        data: dish as CategoryResType['data'],
        message: 'Lấy thông tin danh mục món ăn thành công!'
      })
    }
  )

  fastify.post<{
    Body: CreateCategoryBodyType
    Reply: CategoryResType
  }>(
    '',
    {
      schema: {
        body: CreateCategoryBody,
        response: {
          200: CategoryRes
        }
      },
      // Login AND (Owner OR Employee)
      preValidation: fastify.auth([requireLoginedHook, pauseApiHook, [requireOwnerHook, requireEmployeeHook]], {
        relation: 'and'
      })
    },
    async (request, reply) => {
      const dish = await createCategory(request.body)
      reply.send({
        data: dish as CategoryResType['data'],
        message: 'Tạo danh mục món ăn thành công!'
      })
    }
  )

  fastify.put<{
    Params: CategoryParamsType
    Body: UpdateCategoryBodyType
    Reply: CategoryResType
  }>(
    '/:id',
    {
      schema: {
        params: CategoryParams,
        body: UpdateCategoryBody,
        response: {
          200: CategoryRes
        }
      },
      preValidation: fastify.auth([requireLoginedHook, pauseApiHook, [requireOwnerHook, requireEmployeeHook]], {
        relation: 'and'
      })
    },
    async (request, reply) => {
      const dish = await updateCategory(request.params.id, request.body)
      reply.send({
        data: dish as CategoryResType['data'],
        message: 'Cập nhật danh mục món ăn thành công!'
      })
    }
  )

  fastify.delete<{
    Params: CategoryParamsType
    Reply: CategoryResType
  }>(
    '/:id',
    {
      schema: {
        params: CategoryParams,
        response: {
          200: CategoryRes
        }
      },
      preValidation: fastify.auth([requireLoginedHook, pauseApiHook, [requireOwnerHook, requireEmployeeHook]], {
        relation: 'and'
      })
    },
    async (request, reply) => {
      const result = await deleteCategory(request.params.id)
      reply.send({
        message: 'Xóa danh mục món ăn thành công!',
        data: result as CategoryResType['data']
      })
    }
  )
}
