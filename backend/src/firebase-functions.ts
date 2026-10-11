/**
 * Firebase Cloud Functions Deployment Wrapper
 * To deploy:
 *   1. firebase init functions
 *   2. import this module
 *   3. firebase deploy --only functions
 */
import app from './server.js';

// In Firebase functions environment, export via functions.https.onRequest
export const api = app;
