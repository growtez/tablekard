import { supabase } from '@restaurant-saas/supabase';

const BUCKET_NAME = 'menu-images';

/**
 * Uploads a menu item image to Supabase Storage.
 * Generates a unique filename and places it inside a folder named by restaurantId.
 * 
 * @param restaurantId The restaurant UUID
 * @param file The File object from an input
 * @returns The public URL of the uploaded image
 */
export const uploadMenuItemImage = async (restaurantId: string, file: File): Promise<string> => {
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
        throw new Error(`Failed to upload ${file.name}`);
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
        // Example URL: https://[project].supabase.co/storage/v1/object/public/menu-images/[restaurantId]/[filename]
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
