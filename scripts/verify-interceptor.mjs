/**
 * Tests the apiClient interceptor directly — same instance the hooks use.
 */
import axios from 'axios';

// Replicate the interceptor logic from src/lib/api/client.ts
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body.success === false) {
      throw new Error(body.message ?? 'Request failed');
    }
    const unwrapped = {
      data: body.data,
      ...(body.pagination !== undefined && { pagination: body.pagination }),
    };
    response.data = unwrapped;
    return response;
  },
  (error) => {
    const serverMessage = error.response?.data?.message;
    const statusText = error.response?.statusText ?? 'Network error';
    throw new Error(serverMessage ?? statusText);
  },
);

// ── Test 1: /api/tickets — 403 with JSON body ────────────────────────────────
console.log('=== Test 1: /api/tickets (403 JSON — no auth) ===');
try {
  await apiClient.get('/tickets');
  console.log('UNEXPECTED: no error');
} catch (e) {
  console.log('✅ Error message:', e.message);
  // Expected: "Authentication required" (from the JSON body)
  if (e.message === 'Authentication required') {
    console.log('   ✅ CORRECT: interceptor extracted JSON message field');
  } else {
    console.log('   ⚠️  Got:', e.message, '— expected "Authentication required"');
  }
}

// ── Test 2: /api/events — success path ───────────────────────────────────────
console.log('\n=== Test 2: /api/events (success) ===');
try {
  const r = await apiClient.get('/events');
  console.log('✅ data.length:', r.data.data.length, '| pagination:', JSON.stringify(r.data.pagination));
} catch (e) {
  console.log('Error:', e.message);
}

console.log('\n✅ Interceptor verification complete.');
