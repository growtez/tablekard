import glob
import re

files = glob.glob("src/**/*.tsx", recursive=True)

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # outline badge -> default
    content = content.replace('variant="outline"', 'variant="default"')
    
    # DateTimeFormatOptions fix
    content = content.replace('const options = { day: \'numeric\', month: \'long\', year: \'numeric\' };', 'const options: Intl.DateTimeFormatOptions = { day: \'numeric\', month: \'long\', year: \'numeric\' };')
    
    # setPage fixes if any are left
    content = re.sub(r'setPage\(\s*\'?1\'?\s*\)', 'setPage(1)', content)
    content = re.sub(r'setPage\(p \=\> Math\.max\(1, p - 1\)\)', 'setPage(p => Math.max(1, Number(p) - 1))', content)
    content = re.sub(r'setPage\(p \=\> Math\.min\(totalPages, p \+ 1\)\)', 'setPage(p => Math.min(totalPages, Number(p) + 1))', content)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
