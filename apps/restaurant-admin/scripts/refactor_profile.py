import re
import sys

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. State variable
    content = content.replace(
        'const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);',
        'const [editingSection, setEditingSection] = useState<string | null>(null);'
    )
    
    # 2. handleCancelEdit
    content = content.replace(
        'setIsEditingProfile(false);',
        'setEditingSection(null);'
    )

    # 3. SectionHeader
    old_section_header = """  const SectionHeader = ({ title }: { title: string }) => (
    <div className="pt-4 pb-2 border-b border-[#E2E8F0] dark:border-tk-border">
      <h3 className="text-[18px] font-bold text-[#1A202C] dark:text-tk-text font-['Outfit',sans-serif] m-0 uppercase tracking-wide">
        {title}
      </h3>
    </div>
  );"""
    
    new_section_header = """  const SectionHeader = ({ title, sectionId }: { title: string, sectionId?: string }) => (
    <div className="flex items-center justify-between pt-4 pb-2 border-b border-[#E2E8F0] dark:border-tk-border">
      <h3 className="text-[18px] font-bold text-[#1A202C] dark:text-tk-text font-['Outfit',sans-serif] m-0 uppercase tracking-wide">
        {title}
      </h3>
      {sectionId && editingSection !== sectionId && (
        <button
          className="text-[#4A5568] hover:text-[#1A202C] dark:text-tk-text-secondary dark:hover:text-tk-text font-medium text-[13px] flex items-center gap-1.5 transition-colors"
          onClick={() => {
            setEditingSection(sectionId);
            if (sectionId === 'location') setShowMap(true);
          }}
          disabled={editingSection !== null}
        >
          Edit
        </button>
      )}
      {sectionId && editingSection === sectionId && (
        <div className="flex items-center gap-3">
          <button
            className="text-[#4A5568] hover:text-[#1A202C] dark:text-tk-text-secondary dark:hover:text-tk-text font-medium text-[13px] transition-colors"
            onClick={handleCancelEdit}
          >
            Cancel
          </button>
          <button
            className="text-tk-burgundy hover:text-[#6B2A15] font-bold text-[13px] transition-colors flex items-center gap-1"
            onClick={handleSaveProfile}
            disabled={isRestaurantSaving || isAdminSaving}
          >
            {isRestaurantSaving || isAdminSaving ? "Saving..." : "Save"}
          </button>
        </div>
      )}
    </div>
  );"""
    content = content.replace(old_section_header, new_section_header)

    # 4. Global sticky header Edit Profile logic removal
    # The sticky header has:
    # <div className="flex gap-3">
    #   {isEditingProfile && ( ... )}
    #   {!isEditingProfile && ( ... )}
    # </div>
    # We can just remove the whole <div className="flex gap-3">...</div> block
    header_buttons_pattern = re.compile(r'<div className="flex gap-3">.*?</div>', re.DOTALL)
    content = header_buttons_pattern.sub('', content)

    # 5. The other Edit Profile button (if it exists)
    edit_btn_pattern = re.compile(r'\{!isEditingProfile && \(\s*<button[^>]*>.*?Edit Profile\s*</button>\s*\)\}', re.DOTALL)
    content = edit_btn_pattern.sub('', content)

    # 6. Change <SectionHeader title="Core Details" /> to <SectionHeader title="Core Details" sectionId="core" />
    content = content.replace('<SectionHeader title="Core Details" />', '<SectionHeader title="Core Details" sectionId="core" />')
    content = content.replace('<SectionHeader title="Contact Information" />', '<SectionHeader title="Contact Information" sectionId="contact" />')
    content = content.replace('<SectionHeader title="Location & Operations" />', '<SectionHeader title="Location & Operations" sectionId="location" />')
    content = content.replace('<SectionHeader title="Web & Social Media" />', '<SectionHeader title="Web & Social Media" sectionId="web" />')
    content = content.replace('<SectionHeader title="Administrator Details" />', '<SectionHeader title="Administrator Details" sectionId="admin" />')

    # 7. Replace isEditingProfile ? with editingSection === '...' ? in the code chunks
    # Let's split content into sections and replace
    parts = re.split(r'<SectionHeader', content)
    for i in range(1, len(parts)):
        if 'sectionId="core"' in parts[i]:
            parts[i] = parts[i].replace('isEditingProfile ?', 'editingSection === "core" ?')
        elif 'sectionId="contact"' in parts[i]:
            parts[i] = parts[i].replace('isEditingProfile ?', 'editingSection === "contact" ?')
        elif 'sectionId="location"' in parts[i]:
            parts[i] = parts[i].replace('isEditingProfile ?', 'editingSection === "location" ?')
        elif 'sectionId="web"' in parts[i]:
            parts[i] = parts[i].replace('isEditingProfile ?', 'editingSection === "web" ?')
        elif 'sectionId="admin"' in parts[i]:
            parts[i] = parts[i].replace('isEditingProfile ?', 'editingSection === "admin" ?')

    content = '<SectionHeader'.join(parts)

    # 8. Update map dragging ref logic
    content = content.replace('const isEditingProfileRef = useRef(isEditingProfile);', 'const isEditingProfileRef = useRef(editingSection === "location");')
    content = content.replace('isEditingProfileRef.current = isEditingProfile;', 'isEditingProfileRef.current = editingSection === "location";')
    content = content.replace('!isEditingProfile', 'editingSection !== "location"')
    content = content.replace('isEditingProfile)', 'editingSection === "location")')
    content = content.replace('isEditingProfile,', 'editingSection,')
    content = content.replace('if (isEditingProfile) {', 'if (editingSection === "location") {')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    process_file(r"e:\dev\growtez\tablekard-all\tablekard\apps\restaurant-admin\src\pages\profile\profile.tsx")
