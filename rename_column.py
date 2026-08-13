import glob
import os

patterns = [
    "apps/**/*.ts",
    "apps/**/*.tsx",
    "packages/**/*.ts",
    "supabase/functions/**/*.ts",
    "supabase/schema.sql"
]

files_to_process = []
for pattern in patterns:
    files_to_process.extend(glob.glob(pattern, recursive=True))

for file_path in files_to_process:
    if "node_modules" in file_path or ".next" in file_path or "dist" in file_path:
        continue
        
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'subscription_type' in content:
            new_content = content.replace('subscription_type', 'subscription_plan')
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {file_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
