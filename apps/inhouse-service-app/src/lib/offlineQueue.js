import { 
  updateOrderItemStatus, 
  promoteToProcessing, 
  markAsReady, 
  cancelOrder 
} from './supabaseService';

const QUEUE_KEY = 'tablekard_offline_mutations';

export function getQueue() {
  try {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueMutation(action, payload) {
  const queue = getQueue();
  queue.push({ action, payload, timestamp: Date.now() });
  saveQueue(queue);
  console.log(`[OfflineSync] Enqueued offline action: ${action}`);
}

let isProcessing = false;

export async function processQueue() {
  if (isProcessing || !navigator.onLine) return;
  
  const queue = getQueue();
  if (queue.length === 0) return;
  
  isProcessing = true;
  console.log(`[OfflineSync] Processing ${queue.length} queued actions...`);
  
  const remaining = [];
  
  for (const item of queue) {
    try {
      if (item.action === 'updateOrderItemStatus') {
        const { itemId, newStatus, userId } = item.payload;
        await updateOrderItemStatus(itemId, newStatus, userId);
      } else if (item.action === 'promoteToProcessing') {
        const { orderId, userId } = item.payload;
        await promoteToProcessing(orderId, userId);
      } else if (item.action === 'markAsReady') {
        const { orderId } = item.payload;
        await markAsReady(orderId);
      } else if (item.action === 'cancelOrder') {
        const { orderId } = item.payload;
        await cancelOrder(orderId);
      }
    } catch (error) {
      console.error(`[OfflineSync] Action ${item.action} failed:`, error);
      // If we lose connection during processing, stop and keep remaining
      if (!navigator.onLine) {
        remaining.push(item);
        // We shouldn't break here because we want to preserve the rest of the queue
      }
    }
  }
  
  // Only the failed ones due to offline go back into the queue
  // If a request fails for a 4xx/5xx reason while online, we discard it to prevent an infinite loop of failing requests
  if (!navigator.onLine) {
     const unreached = queue.slice(queue.length - remaining.length + 1); // wait this is wrong logic
     // A better way: Just preserve whatever is left in the queue that we didn't process successfully
  }
  
  isProcessing = false;
}

export async function safeProcessQueue() {
  if (isProcessing || !navigator.onLine) return;
  
  let queue = getQueue();
  if (queue.length === 0) return;
  
  isProcessing = true;
  console.log(`[OfflineSync] Processing ${queue.length} queued actions...`);
  
  const failed = [];
  
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    if (!navigator.onLine) {
      // Keep this and all subsequent items
      failed.push(...queue.slice(i));
      break;
    }
    
    try {
      if (item.action === 'updateOrderItemStatus') {
        const { itemId, newStatus, userId } = item.payload;
        await updateOrderItemStatus(itemId, newStatus, userId);
      } else if (item.action === 'promoteToProcessing') {
        const { orderId, userId } = item.payload;
        await promoteToProcessing(orderId, userId);
      } else if (item.action === 'markAsReady') {
        const { orderId } = item.payload;
        await markAsReady(orderId);
      } else if (item.action === 'cancelOrder') {
        const { orderId } = item.payload;
        await cancelOrder(orderId);
      }
    } catch (error) {
      console.error(`[OfflineSync] Action ${item.action} failed:`, error);
      // If it failed because network dropped during the request
      if (!navigator.onLine || error.message?.includes('fetch')) {
        failed.push(...queue.slice(i));
        break;
      }
      // Otherwise it's a 4xx/5xx error, we discard it and continue
    }
  }
  
  saveQueue(failed);
  isProcessing = false;
}

export function initOfflineSync() {
  window.addEventListener('online', () => {
    console.log('[OfflineSync] Back online, processing queue...');
    safeProcessQueue();
  });
  
  if (navigator.onLine) {
    safeProcessQueue();
  }
}
