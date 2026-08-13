import { supabase } from './supabaseClient';

const PROFILE_BUCKET = 'menu-images';

/**
 * Uploads a profile-related image (logo or avatar) to Supabase Storage.
 * 
 * @param {string} folder A subfolder path like "logos/restaurantId"
 * @param {File} file The File object to upload
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export const uploadProfileImage = async (folder, file) => {
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
