import glob
import re

files = glob.glob("src/**/*.tsx", recursive=True)

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # colSpan="X" -> colSpan={X}
    content = re.sub(r'colSpan="(\d+)"', r'colSpan={\1}', content)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
