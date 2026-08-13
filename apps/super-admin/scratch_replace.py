import glob
import re

files = glob.glob("src/**/*.tsx", recursive=True) + glob.glob("src/**/*.ts", recursive=True)

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # UserDetail / RestaurantDetail badge variant
    content = content.replace('variant="secondary"', 'variant="default"')
    
    # setPage(parseInt(e.target.value) || 1) -> setPage(Number(e.target.value) || 1)
    content = re.sub(r'setPage\(\s*\'?1\'?\s*\)', 'setPage(1)', content)
    content = re.sub(r'setPage\(p\)', 'setPage(Number(p))', content)
    content = re.sub(r'setPage\(parseInt\(e\.target\.value\)\s*\|\|\s*1\)', 'setPage(Number(e.target.value) || 1)', content)
    
    # e.target.closest -> (e.target as Element).closest
    content = content.replace('!e.target.closest', '!(e.target as Element).closest')
    content = content.replace('e.target.closest', '(e.target as Element).closest')

    # Date math (dates subtracting)
    content = re.sub(r'new Date\(([^)]+)\)\s*-\s*new Date\(([^)]+)\)', r'new Date(\1).getTime() - new Date(\2).getTime()', content)
    
    # RestaurantProfileView admins prop
    if file.endswith('RestaurantProfileView.tsx'):
        content = content.replace('export const RestaurantProfileView = ({ restaurant, formData, updateField, saving, handleSave, handleCancel, editingCard, setEditingCard, activeTab }) => {', 'export const RestaurantProfileView = ({ restaurant, formData, updateField, saving, handleSave, handleCancel, editingCard, setEditingCard, activeTab, admins }: any) => {')

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
