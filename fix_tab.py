import re
with open("E:/dev/growtez/tablekard-all/tablekard/apps/super-admin/src/components/OrderHistoryTab.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Fix CSSProperties errors
c = re.sub(
    r'style=\{\{\s*height:\s*\'100\%\',\s*display:\s*\'flex\',\s*alignItems:\s*\'center\',\s*gap:\s*\'6px\',\s*paddingBottom:\s*\'2px\',\s*position:\s*\'relative\',\s*borderBottom:\s*(.*?)\s*\}\}',
    r'style={{ height: \'100%\', display: \'flex\', alignItems: \'center\', gap: \'6px\', paddingBottom: \'2px\', position: \'relative\', borderBottom: \1 } as any}',
    c
)

c = re.sub(
    r'style=\{\{\s*flex:\s*1,\s*display:\s*\'flex\',\s*flexDirection:\s*\'column\',\s*alignItems:\s*\'center\',\s*justifyContent:\s*\'flex-end\',\s*height:\s*\'100\%\',\s*position:\s*\'relative\',\s*cursor:\s*\'pointer\'\s*\}\}',
    r'style={{ flex: 1, display: \'flex\', flexDirection: \'column\', alignItems: \'center\', justifyContent: \'flex-end\', height: \'100%\', position: \'relative\', cursor: \'pointer\' } as any}',
    c
)

c = re.sub(
    r'style=\{\{\s*opacity:\s*hoveredIndex === index \? 1 : 0,\s*position:\s*\'absolute\',\s*top:\s*\'\-45px\',\s*background:\s*\'var\(\-\-surface\-hover\)\',\s*color:\s*\'var\(\-\-text\-main\)\',\s*padding:\s*\'4px 8px\',\s*borderRadius:\s*\'4px\',\s*fontSize:\s*\'11px\',\s*fontWeight:\s*600,\s*transition:\s*\'opacity 0\.2s\',\s*pointerEvents:\s*\'none\',\s*whiteSpace:\s*\'nowrap\',\s*zIndex:\s*10,\s*fontFamily:\s*\'Outfit\'\s*\}\}',
    r'style={{ opacity: hoveredIndex === index ? 1 : 0, position: \'absolute\', top: \'-45px\', background: \'var(--surface-hover)\', color: \'var(--text-main)\', padding: \'4px 8px\', borderRadius: \'4px\', fontSize: \'11px\', fontWeight: 600, transition: \'opacity 0.2s\', pointerEvents: \'none\', whiteSpace: \'nowrap\', zIndex: 10, fontFamily: \'Outfit\' } as any}',
    c
)

c = re.sub(
    r'style=\{\{\s*position:\s*\'absolute\',\s*bottom:\s*\'\-24px\',\s*fontSize:\s*\'10px\',\s*color:\s*\'var\(\-\-text\-muted\)\',\s*whiteSpace:\s*\'nowrap\',\s*fontFamily:\s*\'Outfit\',\s*textAlign:\s*\'center\'\s*\}\}',
    r'style={{ position: \'absolute\', bottom: \'-24px\', fontSize: \'10px\', color: \'var(--text-muted)\', whiteSpace: \'nowrap\', fontFamily: \'Outfit\', textAlign: \'center\' } as any}',
    c
)

# Line 565, 566: const totalRev = Object.values(revMap).reduce((s, v) => s + v.revenue, 0);
c = c.replace('Object.values(revMap).reduce((s, v) => s + v.revenue, 0);', 'Object.values(revMap).reduce((s: any, v: any) => s + v.revenue, 0);')
c = c.replace('Object.values(revMap).reduce((s, v) => s + v.orders, 0);', 'Object.values(revMap).reduce((s: any, v: any) => s + v.orders, 0);')

# Line 600: const nm = i.menu_items?.name || 'Unknown'; 
# Error: Property 'name' does not exist on type '{ name: any; }[]'.
# Ah, i.menu_items is an array!
c = c.replace("const nm = i.menu_items?.name || 'Unknown';", "const nm = Array.isArray(i.menu_items) ? (i.menu_items[0]?.name || 'Unknown') : ((i.menu_items as any)?.name || 'Unknown');")

# Line 946: <circle ... r="4" ... /> 
c = c.replace('r="4"', 'r={4}')
c = c.replace('strokeWidth="2"', 'strokeWidth={2}')

with open("E:/dev/growtez/tablekard-all/tablekard/apps/super-admin/src/components/OrderHistoryTab.tsx", "w", encoding="utf-8") as f:
    f.write(c)
