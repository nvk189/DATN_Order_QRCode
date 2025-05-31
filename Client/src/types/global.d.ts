// global.d.ts hoặc types/cloudinary.d.ts
export {};

declare global {
  interface Window {
    cloudinary: any;
  }
}
