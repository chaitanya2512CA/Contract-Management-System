import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Default Supabase project URL provided for ContractIQ
export const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://vdwhesbuqqdvlbmotjmz.supabase.co';

export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const STORAGE_BUCKETS = {
  CONTRACTS: 'contract-documents',
  CASES: 'case-documents',
  LAWYER_DOCS: 'lawyer-documents',
  PROFILES: 'user-profiles',
  SIGNED_CONTRACTS: 'signed-contracts',
};

let supabaseInstance = null;

/**
 * Returns the initialized Supabase Admin Client.
 * Uses service role key for elevated server-side operations (RLS bypass on server, user management).
 */
export const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;

  const keyToUse = SUPABASE_SERVICE_ROLE_KEY || 'placeholder_anon_key_for_local_dev';
  try {
    supabaseInstance = createClient(SUPABASE_URL, keyToUse, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (err) {
    console.warn('[Supabase] Warning: Unable to initialize Supabase client:', err.message);
  }
  return supabaseInstance;
};

export const supabaseAdmin = getSupabaseClient();

/**
 * Verifies a Supabase JWT access token using the Supabase Auth API
 */
export const verifySupabaseToken = async (token) => {
  if (!token || !SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user) {
      return null;
    }
    return data.user;
  } catch (err) {
    return null;
  }
};

/**
 * Ensures all required storage buckets exist in Supabase Storage
 */
export const ensureStorageBuckets = async () => {
  if (!SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const client = getSupabaseClient();
    const { data: existingBuckets, error } = await client.storage.listBuckets();
    if (error) {
      console.warn('[Supabase Storage] List buckets error:', error.message);
      return;
    }

    const bucketNames = new Set((existingBuckets || []).map((b) => b.name));

    const bucketConfigs = [
      { name: STORAGE_BUCKETS.CONTRACTS, public: false, fileSizeLimit: 26214400 },
      { name: STORAGE_BUCKETS.CASES, public: false, fileSizeLimit: 26214400 },
      { name: STORAGE_BUCKETS.LAWYER_DOCS, public: false, fileSizeLimit: 15728640 },
      { name: STORAGE_BUCKETS.PROFILES, public: true, fileSizeLimit: 5242880 },
      { name: STORAGE_BUCKETS.SIGNED_CONTRACTS, public: false, fileSizeLimit: 26214400 },
    ];

    for (const b of bucketConfigs) {
      if (!bucketNames.has(b.name)) {
        const { error: createErr } = await client.storage.createBucket(b.name, {
          public: b.public,
          fileSizeLimit: b.fileSizeLimit,
        });
        if (createErr && !createErr.message?.includes('already exists')) {
          console.warn(`[Supabase Storage] Notice creating bucket ${b.name}:`, createErr.message);
        } else {
          console.log(`[Supabase Storage] Bucket ${b.name} verified.`);
        }
      }
    }
  } catch (err) {
    console.warn('[Supabase Storage] Bucket setup exception:', err.message);
  }
};

/**
 * Upload a document buffer to a private/public Supabase storage bucket
 */
export const uploadFileToStorage = async (bucket, filePath, fileBuffer, mimeType) => {
  const client = getSupabaseClient();
  const { data, error } = await client.storage.from(bucket).upload(filePath, fileBuffer, {
    contentType: mimeType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  // If public bucket (e.g. user-profiles), return public URL
  if (bucket === STORAGE_BUCKETS.PROFILES) {
    const { data: pubData } = client.storage.from(bucket).getPublicUrl(filePath);
    return { path: data.path, publicUrl: pubData.publicUrl };
  }

  return { path: data.path };
};

/**
 * Generate a signed URL for secure, temporary document download (default 1 hour)
 */
export const createSignedDownloadUrl = async (bucket, filePath, expiresInSeconds = 3600) => {
  const client = getSupabaseClient();
  const { data, error } = await client.storage.from(bucket).createSignedUrl(filePath, expiresInSeconds);
  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }
  return data.signedUrl;
};

/**
 * Delete a file from a storage bucket
 */
export const deleteFileFromStorage = async (bucket, filePath) => {
  const client = getSupabaseClient();
  const { data, error } = await client.storage.from(bucket).remove([filePath]);
  if (error) {
    throw new Error(`Failed to delete file from Supabase storage: ${error.message}`);
  }
  return data;
};

export default {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  STORAGE_BUCKETS,
  getSupabaseClient,
  supabaseAdmin,
  verifySupabaseToken,
  ensureStorageBuckets,
  uploadFileToStorage,
  createSignedDownloadUrl,
  deleteFileFromStorage,
};
