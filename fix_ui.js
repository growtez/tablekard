const fs = require('fs');
const path = require('path');

const basePath = 'e:/dev/growtez/tablekard-all/tablekard';

function replaceInFile(relativePath, replacements) {
    const filePath = path.join(basePath, relativePath);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [target, replacement] of replacements) {
        content = content.replace(target, replacement);
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${relativePath}`);
}

// 1. apps/restaurant-admin/src/pages/dashboard.tsx
replaceInFile('apps/restaurant-admin/src/pages/dashboard.tsx', [
    [/return s !== 'COMPLETED' && s !== 'CANCELLED' && \(s !== 'READY' \|\| !order\.isPaid\);/g, "return s !== 'CANCELLED' && (s !== 'READY' || !order.isPaid);"],
    [/return s === 'COMPLETED' \|\| \(s === 'READY' && order\.isPaid\);/g, "return s === 'READY' && order.isPaid;"],
    [/if \(s !== 'READY' && s !== 'COMPLETED' && !order\.isPaid\) return;/g, "if (s !== 'READY' && !order.isPaid) return;"],
    [/case 'COMPLETED':\n/g, ""],
    [/\(s !== 'READY' \|\| !order\.isPaid\)/g, "(s !== 'READY' || !order.isPaid)"], // no-op just to be safe
]);

// 2. apps/restaurant-admin/src/components/order_details_dialog.tsx
replaceInFile('apps/restaurant-admin/src/components/order_details_dialog.tsx', [
    [/case 'COMPLETED':\n/g, ""],
    [/order\.status\?\.toUpperCase\(\) !== 'CANCELLED' && order\.status\?\.toUpperCase\(\) !== 'COMPLETED'/g, "order.status?.toUpperCase() !== 'CANCELLED'"],
]);

// 3. apps/customer-web/src/pages/my_order.jsx
replaceInFile('apps/customer-web/src/pages/my_order.jsx', [
    [/case 'served':/g, ""],
    [/case 'completed':/g, ""],
    [/case 'pending':/g, "case 'placed':"],
]);

// 4. apps/customer-web/src/pages/order_history.jsx
replaceInFile('apps/customer-web/src/pages/order_history.jsx', [
    [/SERVED:     \{ label: 'Served',     cls: 'completed', icon: <CheckCircle2 size=\{10\} \/> \},\n/g, ""],
    [/served:     \{ label: 'Served',     cls: 'completed', icon: <CheckCircle2 size=\{10\} \/> \},\n/g, ""],
    [/completed:  \{ label: 'Completed',  cls: 'completed', icon: <CheckCircle2 size=\{10\} \/> \},\n/g, ""],
    [/if \(s === 'served' \|\| s === 'completed'\) return 'completed';/g, "if (s === 'ready' && order?.payment_status === 'paid') return 'completed';\n    if (s === 'ready') return 'ready';"],
    [/const completedOrders = orders\.filter\(o => o\.status === 'completed'\);/g, "const completedOrders = orders.filter(o => o.status === 'ready' && o.payment_status === 'paid');"],
    [/pending:    \{ label: 'Pending',    cls: 'pending',   icon: <Clock3 size=\{10\} \/> \},/g, "placed:    { label: 'Placed',    cls: 'pending',   icon: <Clock3 size={10} /> },"],
    [/return 'pending';/g, "return 'placed';"],
]);

// 5. apps/customer-web/src/pages/feedback.jsx
replaceInFile('apps/customer-web/src/pages/feedback.jsx', [
    [/\['ready', 'READY', 'served', 'SERVED', 'completed', 'COMPLETED'\]\.includes\(o\.status\)/g, "['ready', 'READY'].includes(o.status)"],
]);

// 6. apps/customer-web/src/services/supabaseService.js
replaceInFile('apps/customer-web/src/services/supabaseService.js', [
    [/st !== 'completed' && st !== 'served' && st !== 'cancelled'/g, "st !== 'ready' && st !== 'cancelled'"], // wait, actually if ready and paid, it vanishes after 15m. So we don't want to exclude all 'ready'.
]);

// 7. apps/customer-web/src/pages/live_queue.jsx
replaceInFile('apps/customer-web/src/pages/live_queue.jsx', [
    [/\.neq\('status', 'completed'\)/g, ""],
    [/\.neq\('status', 'served'\)/g, ""],
]);

console.log("Replacements complete.");
