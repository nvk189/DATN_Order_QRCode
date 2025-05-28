// import crypto from 'crypto'

// export function generatePayosChecksum(payload: Record<string, any>, secretKey: string): string {
//   const sortedKeys = Object.keys(payload).sort()
//   const dataString = sortedKeys.map((key) => `${key}=${payload[key]}`).join('&')
//   const stringToHash = dataString + secretKey
//   return crypto.createHash('sha256').update(stringToHash).digest('hex')
// }
import crypto from 'crypto'

export function generatePayosChecksum(params: Record<string, any>, secretKey: string): string {
  // 1. Sắp xếp các key theo alphabet
  const sortedKeys = Object.keys(params).sort()

  // 2. Tạo chuỗi dạng key=value nối với dấu &
  const paramString = sortedKeys.map((key) => `${key}=${params[key]}`).join('&')

  // 3. Thêm secretKey vào cuối chuỗi
  const stringToSign = paramString + secretKey

  // 4. Tạo SHA256 hash (hoặc HMAC-SHA256 tuỳ theo yêu cầu)
  const hash = crypto.createHash('sha256').update(stringToSign).digest('hex')

  return hash
}
