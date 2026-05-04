import { supabase } from '@restaurant-saas/supabase';

const BUCKET_NAME = 'menu-images';
const PROFILE_BUCKET = 'menu-images';

/**
 * Uploads a profile-related image (logo or avatar) to Supabase Storage.
 * 
 * @param folder A subfolder path like "logos/restaurantId" or "avatars/userId"
 * @param file The File object to upload
 * @returns The public URL of the uploaded image
 */
export const uploadProfileImage = async (folder: string, file: File): Promise<string> => {
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Only PNG, JPG, WebP, SVG, and GIF images are supported.');
    }

    // Validate file size (max 2MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        throw new Error('Image must be under 2 MB.');
    }

    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from(PROFILE_BUCKET)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (uploadError) {
        console.error('Profile image upload error:', uploadError);
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
    }

    const { data } = supabase.storage
        .from(PROFILE_BUCKET)
        .getPublicUrl(filePath);

    return data.publicUrl;
};

/**
 * Uploads a menu item image to Supabase Storage.
 * Generates a unique filename and places it inside a folder named by restaurantId.
 * 
 * @param restaurantId The restaurant UUID
 * @param file The File object from an input
 * @returns The public URL of the uploaded image
 */
/**
 * Uploads a menu item image to Supabase Storage.
 * Generates a unique filename and places it inside a folder named by restaurantId.
 * 
 * @param restaurantId The restaurant UUID
 * @param file The File object from an input
 * @returns The public URL of the uploaded image
 */
export const uploadMenuItemImage = async (restaurantId: string, file: File): Promise<string> => {
    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        throw new Error('Image must be under 5 MB.');
    }

    // Generate a secure random file name: restaurantId/timestamp-random.ext
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = `${restaurantId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
    }

    const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    return data.publicUrl;
};

/**
 * Deletes an image from the menu-images bucket using its public URL.
 * 
 * @param publicUrl The full public URL of the image
 */
export const deleteMenuItemImageFromStorage = async (publicUrl: string): Promise<void> => {
    try {
        // Extract the file path from the public URL
        const urlObj = new URL(publicUrl);
        const pathParts = urlObj.pathname.split(`/public/${BUCKET_NAME}/`);
        
        if (pathParts.length !== 2) {
            console.warn('Could not parse storage path from URL:', publicUrl);
            return;
        }

        const filePath = pathParts[1];

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([filePath]);

        if (error) {
            console.error('Storage delete error:', error);
            throw error;
        }
    } catch (err) {
        console.error('Failed to parse or delete image URL:', err);
    }
};

// ==========================================
// AR Model (.glb) Upload / Delete
// ==========================================

const AR_BUCKET = 'ar-files';

/**
 * Uploads a .glb 3D model file for AR viewing.
 * Stored under: ar-files/{restaurantId}/{timestamp}-{random}.glb
 *
 * @param restaurantId The restaurant UUID
 * @param file The .glb File object
 * @returns The public URL of the uploaded model
 */
export const uploadARModel = async (restaurantId: string, file: File): Promise<string> => {
    // Validate file type
    const validExtensions = ['.glb', '.gltf'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
        throw new Error('Only .glb and .gltf 3D model files are supported.');
    }

    // Validate file size (max 50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        throw new Error('3D model must be under 50 MB. Check your Supabase bucket limits if this fails.');
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    const filePath = `${restaurantId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from(AR_BUCKET)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (uploadError) {
        console.error('AR model upload error:', uploadError);
        if (uploadError.message.includes('size')) {
            throw new Error(`The 3D model is too large for the current bucket settings. Please increase the "Maximum File Size" for the "${AR_BUCKET}" bucket in your Supabase Dashboard.`);
        }
        throw new Error(`Failed to upload 3D model: ${uploadError.message}`);
    }

    const { data } = supabase.storage
        .from(AR_BUCKET)
        .getPublicUrl(filePath);

    return data.publicUrl;
};

/**
 * Deletes an AR model from storage using its public URL.
 *
 * @param publicUrl The full public URL of the .glb file
 */
export const deleteARModel = async (publicUrl: string): Promise<void> => {
    try {
        const urlObj = new URL(publicUrl);
        const pathParts = urlObj.pathname.split(`/public/${AR_BUCKET}/`);

        if (pathParts.length !== 2) {
            console.warn('Could not parse AR model path from URL:', publicUrl);
            return;
        }

        const filePath = pathParts[1];

        const { error } = await supabase.storage
            .from(AR_BUCKET)
            .remove([filePath]);

        if (error) {
            console.error('AR model delete error:', error);
            throw error;
        }
    } catch (err) {
        console.error('Failed to delete AR model:', err);
    }
};

