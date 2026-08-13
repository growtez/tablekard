import re

filepath = "E:/dev/growtez/tablekard-all/tablekard/apps/super-admin/src/components/OrderHistoryTab.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    c = f.read()

# Fix CSSProperties variables
c = c.replace('const chartContainerStyle = {', 'const chartContainerStyle: React.CSSProperties = {')
c = c.replace('const chartBarGroupStyle = {', 'const chartBarGroupStyle: React.CSSProperties = {')
c = c.replace('const chartBarBaseStyle = {', 'const chartBarBaseStyle: React.CSSProperties = {')
c = c.replace('const chartLabelStyle = {', 'const chartLabelStyle: React.CSSProperties = {')
c = c.replace('const chartTooltipStyle = {', 'const chartTooltipStyle: React.CSSProperties = {')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(c)
