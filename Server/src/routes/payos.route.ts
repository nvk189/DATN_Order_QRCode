import { FastifyInstance } from 'fastify'
import prisma from '@/database'
import PayOS from '@payos/node'
import { OrderStatus } from '@/constants/type'
import { generatePayosChecksum } from '@/utils/payosUtils'

const CLIENT_ID = '953cdff1-f811-45a6-9a1f-8e41326943bf'
const API_KEY = '60aad7b4-ac62-41ef-992c-16891618e83f'
const CHECKSUM_KEY = '4893c4a70a3d68cc33511619e9b78beef649d62376170289d74435e3e7322fdc'

const payOS = new PayOS(CLIENT_ID, API_KEY, CHECKSUM_KEY)

export default async function payosRoutes(fastify: FastifyInstance) {
  fastify.post('/create-payment-link', async (request, reply) => {
    try {
      const { amount, orderIds, description } = request.body as {
        amount: number
        orderIds: number[]
        description?: string
      }
      await prisma.order.updateMany({
        where: { id: { in: orderIds } },
        data: {
          status: 'Paid',
          updatedAt: new Date()
        }
      })
      const orders = await prisma.order.findMany({
        where: { id: { in: orderIds } },
        select: {
          id: true,
          quantity: true,
          dishSnapshot: {
            select: {
              name: true,
              price: true
            }
          }
        }
      })

      if (!amount || amount <= 0 || !orders.length) {
        return reply.status(400).send({ error: 'Invalid parameters' })
      }

      const orderCode = Number(String(Date.now()).slice(-6))

      const items = orders.map((order) => ({
        name: order.dishSnapshot.name,
        quantity: order.quantity,
        price: order.dishSnapshot.price
      }))

      // Giới hạn description tối đa 25 ký tự
      const maxDescriptionLength = 25
      const safeDescription = (description || `Thanh toán đơn hàng ${orderIds.join(',')}`).slice(
        0,
        maxDescriptionLength
      )
      const paymentLinkResponse = await payOS.createPaymentLink({
        orderCode,
        amount,
        description: safeDescription,
        items,
        returnUrl: 'http://localhost:3000/vi/guest/orders',
        cancelUrl: 'http://localhost:3000/vi/guest/orders'
      })

      return reply.send({ checkoutUrl: paymentLinkResponse.checkoutUrl })
    } catch (error: any) {
      fastify.log.error('PayOS create payment error:', error)
      return reply.status(500).send({
        error: 'Payment API error',
        detail: error.response?.data || error.message || error.toString()
      })
    }
  })

  fastify.post('/webhook', async (request, reply) => {
    const payload = request.body as Record<string, any>
    const { orderCode, orderIds, amount, status, timestamp, checksum } = payload

    const computedChecksum = generatePayosChecksum({ orderCode, orderIds, amount, status, timestamp }, CHECKSUM_KEY)

    if (checksum !== computedChecksum) {
      fastify.log.warn('PayOS webhook checksum invalid', { payload })
      return reply.status(400).send({ error: 'Invalid checksum' })
    }

    try {
      let ids: number[] = []
      console.log(ids)
      if (typeof orderIds === 'string') {
        ids = orderIds.split(',').map((id) => parseInt(id.trim()))
      } else if (Array.isArray(orderIds)) {
        ids = orderIds.map((id) => (typeof id === 'string' ? parseInt(id.trim()) : id))
      } else {
        fastify.log.error('Webhook nhận orderIds không hợp lệ:', orderIds)
        return reply.status(400).send({ error: 'Invalid orderIds format' })
      }
      console.log(ids)
      // Tiếp tục cập nhật trạng thái
      await prisma.order.updateMany({
        where: { id: { in: ids } },
        data: { status: OrderStatus.Paid }
      })
      // const updatedOrders = await prisma.order.findMany({
      //   where: { id: { in: ids } },
      //   select: {
      //     id: true,
      //     status: true,
      //     quantity: true,
      //     dishSnapshot: true
      //   }
      // })

      // // Phát sự kiện tới các client
      // // Giả sử bạn có phòng quản lý hoặc gửi tới tất cả client
      // updatedOrders.forEach((order) => {
      //   fastify.io.emit('update-order', order)
      // })
      //   if (status === 'PAID') {
      //     await prisma.order.updateMany({
      //       where: { id: { in: ids } },
      //       data: { status: OrderStatus.Paid }
      //     })
      //   } else if (status === 'FAILED') {
      //     await prisma.order.updateMany({
      //       where: { id: { in: ids } },
      //       data: { status: OrderStatus.Rejected }
      //     })
      //   }

      return reply.send({ success: true })
    } catch (error) {
      fastify.log.error('lỗi webhook thanh toán:', error)
      return reply.status(500).send({ error: 'lỗi cập nhật trạng thái ' })
    }
  })
}
