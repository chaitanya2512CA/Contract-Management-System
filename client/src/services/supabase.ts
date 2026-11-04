import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default provided project URL for ContractIQ
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://vdwhesbuqqdvlbmotjmz.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder_for_local_development';

export const STORAGE_BUCKETS = {
  CONTRACTS: 'contract-documents',
  CASES: 'case-documents',
  LAWYER_DOCS: 'lawyer-documents',
  PROFILES: 'user-profiles',
  SIGNED_CONTRACTS: 'signed-contracts',
} as const;

// Create and export singleton Supabase client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/* ================= SUPABASE STORAGE HELPERS ================= */

export interface UploadOptions {
  upsert?: boolean;
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

/**
 * Uploads a file to a Supabase Storage bucket with validation
 */
export const uploadDocument = async (
  bucket: string,
  path: string,
  file: File,
  options: UploadOptions = {}
): Promise<{ path: string; publicUrl?: string }> => {
  const { upsert = true, maxSizeBytes = 25 * 1024 * 1024, allowedTypes } = options;

  if (file.size > maxSizeBytes) {
    throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds limit of ${(maxSizeBytes / 1024 / 1024).toFixed(1)} MB.`);
  }

  if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type || 'unknown'} is not allowed. Supported: ${allowedTypes.join(', ')}`);
  }

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert,
  });

  if (error) {
    throw new Error(`Document upload to Supabase Storage failed: ${error.message}`);
  }

  if (bucket === STORAGE_BUCKETS.PROFILES) {
    const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(path);
    return { path: data.path, publicUrl: pubData.publicUrl };
  }

  return { path: data.path };
};

/**
 * Retrieves a signed URL for secure download of a private document
 */
export const getSignedDocumentUrl = async (
  bucket: string,
  path: string,
  expiresInSeconds: number = 3600
): Promise<string> => {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) {
    throw new Error(`Failed to generate signed document URL: ${error.message}`);
  }
  return data.signedUrl;
};

/**
 * Retrieves public URL for public bucket assets (e.g. user-profiles)
 */
export const getPublicDocumentUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/* ================= SUPABASE REALTIME HELPERS ================= */

/**
 * Subscribe to new chat messages for a specific conversation / booking
 */
export const subscribeToMessages = (
  bookingOrConversationId: string,
  onMessage: (message: any) => void
) => {
  const channel = supabase
    .channel(`messages:${bookingOrConversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        if (
          payload.new &&
          (payload.new.booking_id === bookingOrConversationId ||
            payload.new.conversation_id === bookingOrConversationId)
        ) {
          onMessage(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to status updates for a consultation booking
 */
export const subscribeToBookingUpdates = (
  bookingId: string,
  onUpdate: (booking: any) => void
) => {
  const channel = supabase
    .channel(`booking:${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'consultation_bookings',
        filter: `id=eq.${bookingId}`,
      },
      (payload) => {
        onUpdate(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to real-time notifications for a specific user
 */
export const subscribeToNotifications = (
  userId: string,
  onNotification: (notification: any) => void
) => {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export default supabase;
