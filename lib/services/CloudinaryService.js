import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export class CloudinaryService {
  static async upload(file, options = {}) {
    const {
      folder = 'piolec',
      filename,
      transformation = [],
      resourceType = 'auto',
    } = options;

    try {
      const result = await cloudinary.uploader.upload(file, {
        folder,
        resource_type: resourceType,
        public_id: filename ? filename.split('.')[0] : undefined,
        transformation,
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        folder: result.folder,
        originalFilename: result.original_filename,
        mimeType: result.resource_type,
      };
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  static async uploadBuffer(buffer, options = {}) {
    const {
      folder = 'piolec',
      filename = 'upload',
      transformation = [],
      resourceType = 'auto',
    } = options;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          public_id: filename.split('.')[0],
          transformation,
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Upload failed: ${error.message}`));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              width: result.width,
              height: result.height,
              bytes: result.bytes,
              folder: result.folder,
              originalFilename: result.original_filename,
              mimeType: result.resource_type,
            });
          }
        }
      );

      uploadStream.end(buffer);
    });
  }

  static async uploadFromUrl(url, options = {}) {
    const {
      folder = 'piolec',
      filename,
      resourceType = 'auto',
    } = options;

    try {
      const result = await cloudinary.uploader.upload(url, {
        folder,
        resource_type: resourceType,
        public_id: filename ? filename.split('.')[0] : undefined,
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        folder: result.folder,
        originalFilename: result.original_filename,
        mimeType: result.resource_type,
      };
    } catch (error) {
      throw new Error(`Upload from URL failed: ${error.message}`);
    }
  }

  static async replace(publicId, file, options = {}) {
    const {
      folder = 'piolec',
      resourceType = 'auto',
    } = options;

    try {
      const result = await cloudinary.uploader.upload(file, {
        folder,
        resource_type: resourceType,
        public_id: publicId,
        overwrite: true,
        invalidate: true,
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        folder: result.folder,
      };
    } catch (error) {
      throw new Error(`Replace failed: ${error.message}`);
    }
  }

  static async delete(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  static async deleteMultiple(publicIds) {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return result;
    } catch (error) {
      throw new Error(`Bulk delete failed: ${error.message}`);
    }
  }

  static async getMetadata(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        createdAt: result.created_at,
        folder: result.folder,
        type: result.type,
        metadata: result.context,
      };
    } catch (error) {
      throw new Error(`Metadata fetch failed: ${error.message}`);
    }
  }

  static generateThumbnail(publicId, options = {}) {
    const { width = 300, height = 300, crop = 'fill' } = options;
    return cloudinary.url(publicId, {
      transformation: [
        { width, height, crop },
      ],
    });
  }

  static generateResponsive(publicId, options = {}) {
    const { format = 'auto' } = options;
    return {
      sm: cloudinary.url(publicId, { transformation: [{ width: 150, height: 150, crop: 'fill' }], format }),
      md: cloudinary.url(publicId, { transformation: [{ width: 300, height: 300, crop: 'fill' }], format }),
      lg: cloudinary.url(publicId, { transformation: [{ width: 600, height: 600, crop: 'fill' }], format }),
    };
  }
}

export default CloudinaryService;
