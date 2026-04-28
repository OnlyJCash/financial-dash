import outputs from '@/amplify_outputs.json';
import { Amplify } from 'aws-amplify';

/**
 * Single source of truth for Amplify configuration.
 * Call this once — in Providers.tsx — and nowhere else.
 */
Amplify.configure(outputs, { ssr: true });
