const fs = require('fs');
const path = require('path');

const tsxPath = path.join(__dirname, 'src', 'pages', 'reports.tsx');
let tsxContent = fs.readFileSync(tsxPath, 'utf8');

// Remove CSS import
tsxContent = tsxContent.replace(/import '\.\/reports\.css';\n?/g, '');

// A mapping of the classes from reports.css to Tailwind
const classMap = {
    'reports-container': 'flex min-h-screen bg-tk-bg relative',
    'reports-main-content': 'flex-1 p-5 pl-8 overflow-y-auto min-h-screen transition-all duration-300 ml-[240px] [.sidebar-collapsed_&]:ml-[80px] max-md:!ml-0 max-md:!p-4 max-md:!pt-[72px] bg-tk-bg-surface rounded-l-[32px] shadow-[-8px_0_24px_rgba(0,0,0,0.12)]',
    'reports-header': 'flex justify-between items-center mb-8',
    'reports-page-title': 'text-2xl font-semibold text-[#1A202C] m-0 font-sans',
    'reports-header-right': 'flex items-center gap-4',
    'reports-icon-button': 'w-11 h-11 rounded-full bg-white flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-transform duration-200 hover:-translate-y-0.5',
    'reports-user-avatar': 'w-11 h-11 rounded-full bg-tk-burgundy flex items-center justify-center text-xl cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform duration-200 hover:-translate-y-0.5',
    'metrics-grid': 'grid grid-cols-3 gap-6 mb-8',
    'metric-card': 'bg-white rounded-tk-lg p-6 flex items-center shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-300 border-[1.5px] border-transparent hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(139,58,30,0.08)] hover:border-tk-burgundy/20',
    'metric-icon-wrapper': 'w-14 h-14 rounded-2xl flex items-center justify-center mr-5 transition-transform duration-300 group-hover:scale-110',
    'metric-icon-wrapper.revenue': 'bg-tk-burgundy-bg text-tk-burgundy',
    'metric-icon-wrapper.orders': 'bg-[#FFF9E6] text-[#F2B84B]',
    'metric-icon-wrapper.items': 'bg-[#E6F4EA] text-[#4CAF50]',
    'metric-content': 'flex flex-col',
    'metric-label': 'text-[15px] text-tk-text-secondary font-medium mb-1',
    'metric-value': 'text-[28px] font-bold text-tk-text m-0 leading-tight',
    'metric-trend': 'flex items-center mt-2 text-[13.5px] font-medium',
    'metric-trend.positive': 'text-[#4CAF50]',
    'metric-trend.negative': 'text-[#E14B4B]',
    'trend-icon': 'mr-1',
    'trend-text': 'text-tk-text-muted ml-1.5 font-normal',
    'reports-filters-section': 'flex justify-between items-center bg-white p-4 rounded-tk-lg shadow-sm border border-tk-border mb-8',
    'reports-filters-left': 'flex gap-3',
    'report-filter-btn': 'px-4 py-2 rounded-tk-md text-[14px] font-medium transition-all duration-200 bg-transparent text-tk-text-secondary border-none cursor-pointer hover:bg-tk-bg-hover hover:text-tk-burgundy',
    'report-filter-btn.active': 'bg-tk-burgundy text-white shadow-md',
    'reports-filters-right': 'flex gap-4 items-center',
    'date-picker-wrapper': 'flex items-center gap-2 bg-tk-bg-surface px-4 py-2 rounded-tk-md border border-tk-border',
    'date-picker-icon': 'text-tk-text-secondary',
    'date-picker-input': 'bg-transparent border-none text-[14px] font-medium text-tk-text outline-none cursor-pointer',
    'export-btn': 'flex items-center gap-2 px-5 py-2.5 rounded-tk-md bg-white border-2 border-tk-burgundy text-tk-burgundy font-semibold text-[14px] cursor-pointer transition-all duration-200 hover:bg-tk-burgundy hover:text-white shadow-sm hover:shadow-md',
    'charts-grid': 'grid grid-cols-2 gap-6 mb-8',
    'chart-card': 'bg-white rounded-tk-lg p-6 shadow-sm border border-tk-border flex flex-col',
    'chart-header': 'flex justify-between items-center mb-6',
    'chart-title': 'text-[18px] font-semibold text-tk-text m-0',
    'chart-actions': 'flex items-center gap-2',
    'chart-action-btn': 'bg-transparent border-none text-tk-text-secondary cursor-pointer p-1.5 rounded-md transition-colors duration-200 hover:bg-tk-bg-hover hover:text-tk-burgundy',
    'chart-body': 'flex-1 min-h-[300px] w-full relative flex items-end gap-2 pb-6 pt-4 border-b border-l border-tk-border px-2',
    'chart-bar-group': 'flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer',
    'chart-bar': 'w-full max-w-[40px] bg-tk-burgundy-light rounded-t-md transition-all duration-300 relative group-hover:bg-tk-burgundy',
    'chart-bar-label': 'absolute -bottom-6 text-[12px] text-tk-text-secondary font-medium whitespace-nowrap',
    'chart-bar-tooltip': 'absolute -top-10 bg-gray-800 text-white text-[12px] px-2 py-1 rounded opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100 whitespace-nowrap z-10',
    'pie-chart-container': 'flex-1 flex items-center justify-center relative min-h-[300px]',
    'pie-chart': 'w-[200px] h-[200px] rounded-full relative overflow-hidden shadow-inner',
    'pie-slice': 'absolute top-0 left-0 w-full h-full',
    'pie-center': 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] bg-white rounded-full flex flex-col items-center justify-center shadow-sm z-10',
    'pie-center-value': 'text-[24px] font-bold text-tk-text',
    'pie-center-label': 'text-[12px] text-tk-text-secondary font-medium',
    'pie-legend': 'mt-6 flex flex-col gap-3',
    'legend-item': 'flex items-center justify-between',
    'legend-label-group': 'flex items-center gap-2',
    'legend-dot': 'w-3 h-3 rounded-full',
    'legend-label': 'text-[14px] text-tk-text font-medium',
    'legend-value': 'text-[14px] text-tk-text-secondary font-semibold',
    'detailed-reports-section': 'bg-white rounded-tk-lg shadow-sm border border-tk-border overflow-hidden mb-8',
    'detailed-reports-header': 'flex justify-between items-center p-6 border-b border-tk-border bg-[#FAFAFA]',
    'detailed-reports-title': 'text-[18px] font-semibold text-tk-text m-0',
    'view-all-btn': 'text-[14px] font-semibold text-tk-burgundy bg-transparent border-none cursor-pointer transition-colors duration-200 hover:text-tk-burgundy-dark',
    'reports-table-wrapper': 'overflow-x-auto',
    'reports-table': 'w-full border-collapse text-left',
    'reports-table th': 'bg-[#FAFAFA] text-tk-text-secondary text-[13px] font-semibold uppercase tracking-wider py-4 px-6 border-b border-tk-border',
    'reports-table td': 'py-4 px-6 border-b border-tk-border align-middle text-[14.5px] font-medium text-tk-text transition-colors duration-200',
    'reports-table tbody tr:hover td': 'bg-[#FAFAFA]',
    'reports-table tbody tr:last-child td': 'border-b-0',
    'item-rank-tag': 'inline-flex items-center justify-center w-8 h-8 rounded-full text-[13px] font-bold',
    'rank-1': 'bg-[#FFF4E5] text-[#F2B84B]',
    'rank-2': 'bg-[#F0F4F8] text-[#94A3B8]',
    'rank-3': 'bg-[#FEF2F2] text-[#E14B4B]',
    'item-name-cell': 'flex items-center gap-3',
    'item-image-placeholder': 'w-10 h-10 rounded-md bg-tk-bg-surface flex items-center justify-center text-tk-text-muted',
    'item-name-text': 'font-semibold text-tk-text',
    'item-category-text': 'text-[12px] text-tk-text-secondary mt-0.5 block font-normal',
    'item-sold-count': 'inline-flex items-center justify-center bg-tk-burgundy-bg text-tk-burgundy px-3 py-1 rounded-full text-[13px] font-bold',
    'item-revenue-text': 'font-bold text-tk-text',
    'reports-modal-overlay': 'fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 opacity-100 transition-opacity duration-300',
    'reports-modal-content': 'bg-white rounded-tk-lg w-full max-w-[800px] max-h-[90vh] flex flex-col shadow-[0_20px_40px_rgba(0,0,0,0.2)] transform scale-100 transition-all duration-300',
    'reports-modal-header': 'p-6 border-b border-tk-border flex justify-between items-center',
    'reports-modal-title': 'text-[20px] font-bold text-tk-text m-0',
    'reports-modal-close': 'bg-transparent border-none text-tk-text-secondary cursor-pointer p-2 rounded-full transition-all duration-200 flex items-center justify-center hover:bg-tk-bg-hover hover:text-tk-burgundy',
    'reports-modal-body': 'p-6 overflow-y-auto flex-1',
    'top-items-table': 'w-full border-collapse',
    'top-items-table th': 'text-left py-3 px-4 text-tk-text-secondary text-[13px] font-semibold uppercase tracking-wider border-b border-tk-border',
    'top-items-table td': 'py-4 px-4 border-b border-tk-border align-middle transition-colors duration-200',
    'top-items-table tbody tr:hover td': 'bg-[#FAFAFA]',
    'reports-modal-footer': 'p-6 border-t border-tk-border flex justify-end bg-[#FAFAFA] rounded-b-tk-lg'
};

// Loop through all classes and replace them
Object.keys(classMap).forEach(cls => {
    // Escape dots in class names like metric-icon-wrapper.revenue
    const safeCls = cls.replace(/\./g, ' ');
    
    // Sometimes classes in tsx are space separated, we replace exactly the word
    if (cls.includes('.')) {
        const parts = cls.split('.');
        const regex = new RegExp(`className="(.*?)` + parts.join(' ') + `(.*?)"`, 'g');
        tsxContent = tsxContent.replace(regex, `className="$1${classMap[cls]}$2"`);
        
        // Also handle cases where they are dynamically joined
        const regex2 = new RegExp(`className=\\{([^\}]+)'` + parts.join(' ') + `'([^\}]+)\\}`, 'g');
        tsxContent = tsxContent.replace(regex2, `className={$1'${classMap[cls]}'$2}`);
    } else {
        const regex = new RegExp(`className="(.*?)\\b` + cls + `\\b(.*?)"`, 'g');
        tsxContent = tsxContent.replace(regex, `className="$1${classMap[cls]}$2"`);
    }
});

// Write it back
fs.writeFileSync(tsxPath, tsxContent);
console.log('Successfully migrated reports.tsx');
