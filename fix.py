import os

file_path = r'e:\dev\growtez\tablekard-all\tablekard\supabase\functions\verify-razorpay-payment\index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if line.strip() == '.eq("event_type", "ORDER_CREATED")':
        new_lines.append(line)
        new_lines.append('            .single();\n\n')
        new_lines.append('        if (logError || !logEntry) {\n')
        new_lines.append('            throw new Error("Cart data not found in payment logs");\n')
        new_lines.append('        }\n\n')
        new_lines.append('        const cartData = logEntry.event_data;\n')
        new_lines.append('        const orderNumber = generateOrderNumber();\n\n')
        new_lines.append('        // ──────────────────────────────────────────────\n')
        new_lines.append('        // 6. CREATE the order (NOW — after payment is verified)\n')
        new_lines.append('        // ──────────────────────────────────────────────\n')
        new_lines.append('        const { data: order, error: orderError } = await supabaseAdmin\n')
        new_lines.append('            .from("orders")\n')
        new_lines.append('            .insert({\n')
        new_lines.append('                customer_id: user.id,\n')
        new_lines.append('                restaurant_id: cartData.restaurant_id,\n')
        new_lines.append('                order_number: orderNumber,\n')
        new_lines.append('                type: cartData.order_type?.toLowerCase() || "dine_in",\n')
        new_lines.append('                status: "pending",                      // ⏳ Pending restaurant acceptance\n')
        new_lines.append('                table_id: (typeof cartData.table_id === \'string\' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cartData.table_id)) ? cartData.table_id : null,\n')
        new_lines.append('                payment_method: "online",\n')
        new_lines.append('                payment_status: "paid",                  // ✅ Already paid\n')
        new_lines.append('                subtotal: cartData.subtotal,\n')
        new_lines.append('                taxes: cartData.taxes,\n')
        new_lines.append('                discount: 0,\n')
        new_lines.append('                total: cartData.amount || paymentRecord.amount,\n')
        new_lines.append('            })\n')
        new_lines.append('            .select("id, order_number")\n')
        new_lines.append('            .single();\n\n')
        new_lines.append('        if (orderError || !order) {\n')
        new_lines.append('            console.error("Order creation failed:", orderError);\n')
        new_lines.append('            throw new Error(`Failed to create order: ${orderError?.message}`);\n')
        new_lines.append('        }\n\n')
        new_lines.append('        // ──────────────────────────────────────────────\n')
        new_lines.append('        // 7. CREATE order_items\n')
        new_lines.append('        // ──────────────────────────────────────────────\n')
        new_lines.append('        const orderItems = cartData.items.map((item: any) => ({\n')
    elif i >= 191 and i <= 200:
        continue # skip the corrupted part
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Done')
