import { ManagerRoom, Role } from '@/constants/type'
import { z } from 'zod'

import {
  getGuestDetail,
  guestCreateOrdersController,
  guestGetOrdersController,
  guestLoginController,
  guestLogoutController,
  guestRefreshTokenController,
  updateAddress
} from '@/controllers/guest.controller'
import { requireGuestHook, requireLoginedHook } from '@/hooks/auth.hooks'
import {
  LogoutBody,
  LogoutBodyType,
  RefreshTokenBody,
  RefreshTokenBodyType,
  RefreshTokenRes,
  RefreshTokenResType
} from '@/schemaValidations/auth.schema'
import { MessageRes, MessageResType } from '@/schemaValidations/common.schema'
import {
  GuestCreateOrdersBody,
  GuestCreateOrdersBodyType,
  GuestCreateOrdersRes,
  GuestCreateOrdersResType,
  GuestGetOrdersRes,
  GuestGetOrdersResType,
  GuestPhoneParams,
  GuestInfoRes,
  GuestLoginBody,
  GuestLoginBodyType,
  GuestPhoneParamsType,
  GuestInfoResType,
  GuestLoginRes,
  GuestLoginResType,
  GuestUpdateParamsType,
  GuestUpdateParams
} from '@/schemaValidations/guest.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function guestRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.post<{ Reply: GuestLoginResType; Body: GuestLoginBodyType }>(
    '/auth/login',
    {
      schema: {
        response: {
          200: GuestLoginRes
        },
        body: GuestLoginBody
      }
    },
    async (request, reply) => {
      const { body } = request
      const result = await guestLoginController(body)
      reply.send({
        message: 'Đăng nhập thành công',
        data: {
          guest: {
            id: result.guest.id,
            name: result.guest.name,
            address: result.guest.address,
            phone: result.guest.phone,
            role: Role.Guest,
            tableNumber: result.guest.tableNumber,
            createdAt: result.guest.createdAt,
            updatedAt: result.guest.updatedAt
          },
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      })
    }
  )
  fastify.post<{ Reply: MessageResType; Body: LogoutBodyType }>(
    '/auth/logout',
    {
      schema: {
        response: {
          200: MessageRes
        },
        body: LogoutBody
      },
      preValidation: fastify.auth([requireLoginedHook])
    },
    async (request, reply) => {
      const message = await guestLogoutController(request.decodedAccessToken?.userId as number)
      reply.send({
        message
      })
    }
  )

  fastify.post<{
    Reply: RefreshTokenResType
    Body: RefreshTokenBodyType
  }>(
    '/auth/refresh-token',
    {
      schema: {
        response: {
          200: RefreshTokenRes
        },
        body: RefreshTokenBody
      }
    },
    async (request, reply) => {
      const result = await guestRefreshTokenController(request.body.refreshToken)
      reply.send({
        message: 'Lấy token mới thành công',
        data: result
      })
    }
  )

  fastify.post<{
    Reply: GuestCreateOrdersResType
    Body: GuestCreateOrdersBodyType
  }>(
    '/orders',
    {
      schema: {
        response: {
          200: GuestCreateOrdersRes
        },
        body: GuestCreateOrdersBody
      },
      preValidation: fastify.auth([requireLoginedHook, requireGuestHook])
    },
    async (request, reply) => {
      const guestId = request.decodedAccessToken?.userId as number
      const result = await guestCreateOrdersController(guestId, request.body)
      fastify.io.to(ManagerRoom).emit('new-order', result)
      reply.send({
        message: 'Đặt món thành công',
        data: result as GuestCreateOrdersResType['data']
      })
    }
  )

  fastify.get<{
    Reply: GuestGetOrdersResType
  }>(
    '/orders',
    {
      schema: {
        response: {
          200: GuestGetOrdersRes
        }
      },
      preValidation: fastify.auth([requireLoginedHook, requireGuestHook])
    },
    async (request, reply) => {
      const guestId = request.decodedAccessToken?.userId as number
      const result = await guestGetOrdersController(guestId)
      reply.send({
        message: 'Lấy danh sách đơn hàng thành công',
        data: result as GuestGetOrdersResType['data']
      })
    }
  )

  fastify.get<{
    Params: GuestPhoneParamsType
    Reply: GuestInfoResType
  }>(
    '/:phone',
    {
      schema: {
        params: GuestPhoneParams,
        response: {
          200: GuestInfoRes
        }
      }
    },
    async (request, reply) => {
      const guest = await getGuestDetail(request.params.phone)

      return reply.send({
        data: guest as GuestInfoResType['data'],
        message: 'Lấy thông tin khách thành công!'
      })
    }
  )

  fastify.put<{
    Params: { id: number }
    Body: GuestUpdateParamsType
    Reply: GuestInfoResType
  }>(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.coerce.number() }),
        body: GuestUpdateParams,
        response: { 200: GuestInfoRes }
      }
    },
    async (request, reply) => {
      const updated = await updateAddress(request.params.id, request.body)

      return reply.send({
        data: updated as GuestInfoResType['data'],
        message: 'Cập nhật thành công!'
      })
    }
  )
}
