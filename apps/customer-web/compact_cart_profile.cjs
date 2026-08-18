const fs = require('fs');

function compactMyOrder() {
    let content = fs.readFileSync('src/pages/my_order.css', 'utf8');

    // Container
    content = content.replace(/padding-bottom: 100px;/g, 'padding-bottom: 80px;');
    // Header
    content = content.replace(/padding: 12px 20px;/g, 'padding: 10px 16px;');
    // Hero
    content = content.replace(/padding: 2px 20px 8px;/g, 'padding: 2px 16px 6px;');
    content = content.replace(/font-size: 24px;/g, 'font-size: 22px;');
    // Tabs
    content = content.replace(/padding: 0 20px 14px;/g, 'padding: 0 16px 10px;');
    content = content.replace(/padding: 10px 16px;/g, 'padding: 8px 14px;');
    // Cart content
    content = content.replace(/padding: 20px;/g, 'padding: 16px;');
    content = content.replace(/gap: 16px;\n  margin-bottom: 32px;/g, 'gap: 12px;\n  margin-bottom: 24px;');
    content = content.replace(/padding: 14px;\n  border: 1.2px solid rgba/g, 'padding: 12px;\n  border: 1.2px solid rgba');
    content = content.replace(/width: 90px;\n  height: 90px;/g, 'width: 80px;\n  height: 80px;');
    content = content.replace(/font-size: 18px;\n  font-weight: 800;/g, 'font-size: 16px;\n  font-weight: 800;');
    content = content.replace(/padding: 24px;\n  border: 1.2px solid rgba/g, 'padding: 16px;\n  border: 1.2px solid rgba');
    content = content.replace(/margin-bottom: 24px;/g, 'margin-bottom: 16px;');
    // Orders
    content = content.replace(/gap: 20px;/g, 'gap: 14px;');
    // Empty state
    content = content.replace(/padding: 60px 40px;/g, 'padding: 40px 20px;');
    content = content.replace(/width: 150px;/g, 'width: 120px;');

    fs.writeFileSync('src/pages/my_order.css', content);
}

function compactProfile() {
    let content = fs.readFileSync('src/pages/profile.css', 'utf8');

    // Container
    content = content.replace(/padding-bottom: 100px;/g, 'padding-bottom: 80px;');
    // Hero
    content = content.replace(/padding: 16px 24px 40px;/g, 'padding: 12px 16px 24px;');
    content = content.replace(/margin-bottom: 32px;/g, 'margin-bottom: 20px;');
    // Avatar
    content = content.replace(/width: 100px;\n  height: 100px;/g, 'width: 80px;\n  height: 80px;');
    content = content.replace(/font-size: 26px;/g, 'font-size: 22px;');
    content = content.replace(/margin-bottom: 20px;/g, 'margin-bottom: 14px;');
    // Content padding
    content = content.replace(/padding: 0 20px;/g, 'padding: 0 16px;');
    // Stats
    content = content.replace(/padding: 20px;\n  display: flex;/g, 'padding: 16px;\n  display: flex;');
    content = content.replace(/font-size: 22px;/g, 'font-size: 20px;');
    // Form
    content = content.replace(/padding: 24px;\n  margin-bottom: 20px;/g, 'padding: 16px;\n  margin-bottom: 14px;');
    content = content.replace(/font-size: 18px;\n  font-weight: 700;/g, 'font-size: 16px;\n  font-weight: 700;');
    // Actions
    content = content.replace(/gap: 12px;\n  margin-bottom: 24px;/g, 'gap: 12px;\n  margin-bottom: 16px;');
    content = content.replace(/padding: 18px 12px;/g, 'padding: 12px 10px;');
    content = content.replace(/width: 48px;\n  height: 48px;/g, 'width: 40px;\n  height: 40px;');
    // Menu List
    content = content.replace(/padding: 16px 18px;/g, 'padding: 12px 16px;');
    content = content.replace(/gap: 12px;/g, 'gap: 8px;');
    content = content.replace(/margin-bottom: 20px;/g, 'margin-bottom: 14px;');
    
    fs.writeFileSync('src/pages/profile.css', content);
}

compactMyOrder();
compactProfile();
console.log("Compaction complete");
