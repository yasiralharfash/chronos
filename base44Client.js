import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68e3983fd3040aa1f7854eca", 
  requiresAuth: true // Ensure authentication is required for all operations
});
