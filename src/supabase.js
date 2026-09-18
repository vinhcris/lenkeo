// Static HTML version: import package directly from ESM CDN, no build step required.
// When using Vite/React, replace the next line with: import { createClient } from '@supabase/supabase-js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
