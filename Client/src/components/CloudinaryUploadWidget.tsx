// "use client";

// import { useEffect } from "react";

// type CloudinaryUploadWidgetProps = {
//   onUpload: (url: string) => void;
// };

// export default function CloudinaryUploadWidget({
//   onUpload,
// }: CloudinaryUploadWidgetProps) {
//   const handleOpenWidget = () => {
//     if (!window.cloudinary) return;

//     const widget = window.cloudinary.createUploadWidget(
//       {
//         cloudName: "duebclpy7",
//         uploadPreset: "upload-img",
//         sources: ["local", "url", "camera"],
//         multiple: false,
//         cropping: false,
//       },
//       (error: any, result: any) => {
//         if (!error && result.event === "success") {
//           onUpload(result.info.secure_url);
//         }
//       }
//     );

//     widget.open();
//   };

//   return (
//     <button type="button" onClick={handleOpenWidget}>
//       Tải ảnh lên
//     </button>
//   );
// }

import { useEffect } from "react";

type Props = {
  file: File;
  onUploadSuccess: (url: string) => void;
};

export default function CloudinaryUploadWidget({
  file,
  onUploadSuccess,
}: Props) {
  useEffect(() => {
    const upload = async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "upload-img"); // cloudinary preset

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/duebclpy7/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      onUploadSuccess(data.secure_url);
    };

    if (file) {
      upload();
    }
  }, [file, onUploadSuccess]);

  return null; // vì đây là upload không hiển thị gì
}
