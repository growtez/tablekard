const fs = require('fs');
const file = 'apps/super-admin/src/pages/billing/Plans.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add Search to lucide-react imports
code = code.replace(
  /import \{ (.*?) \} from 'lucide-react';/,
  "import { $1, Search } from 'lucide-react';"
);

// 2. Add allRestaurants and searchQueries states
code = code.replace(
  'const [editedPlans, setEditedPlans] = useState([]);',
  `const [editedPlans, setEditedPlans] = useState([]);
    const [allRestaurants, setAllRestaurants] = useState([]);
    const [searchQueries, setSearchQueries] = useState({});`
);

// 3. Fetch restaurants in fetchData
const fetchRegex = /const \{ data, error: err \} = await supabase/;
const fetchReplace = `const { data: restData } = await supabase.from('restaurants').select('id, name');
            setAllRestaurants(restData || []);

            const { data, error: err } = await supabase`;
code = code.replace(fetchRegex, fetchReplace);

// 4. Replace the specific text input with a custom multiselect dropdown
const oldSpecific = /\{trial\.visibility === 'specific' && \([\s\S]*?<label className="text-xs font-semibold text-text-muted">Allowed Restaurant IDs \(comma separated\)<\/label>\s*<input[\s\S]*?className="mt-1 w-full text-\[13px\] px-3 py-2 rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-emerald-500"[\s\S]*?\/>\s*<\/div>\s*\)\}/;

const newSpecific = `{trial.visibility === 'specific' && (
                                                <div className="animate-fade-in mt-3 border border-border rounded-xl bg-surface overflow-hidden shadow-sm">
                                                    <div className="bg-surface-hover px-3 py-2 border-b border-border flex items-center gap-2">
                                                        <Search size={14} className="text-text-muted" />
                                                        <input 
                                                            placeholder="Search restaurants to allow..."
                                                            value={searchQueries[idx] || ''}
                                                            onChange={e => setSearchQueries(prev => ({ ...prev, [idx]: e.target.value }))}
                                                            className="bg-transparent border-none focus:outline-none text-[13px] w-full text-text-main"
                                                        />
                                                    </div>
                                                    <div className="max-h-[160px] overflow-y-auto p-1.5 flex flex-col gap-0.5">
                                                        {allRestaurants
                                                            .filter(r => (r.name || r.id).toLowerCase().includes((searchQueries[idx] || '').toLowerCase()))
                                                            .map(r => {
                                                                const currentIds = (trial.allowed_restaurant_ids || '').split(',').map(id => id.trim()).filter(Boolean);
                                                                const isSelected = currentIds.includes(r.id);
                                                                
                                                                return (
                                                                    <div 
                                                                        key={r.id} 
                                                                        onClick={() => {
                                                                            let newIds;
                                                                            if (isSelected) {
                                                                                newIds = currentIds.filter(id => id !== r.id);
                                                                            } else {
                                                                                newIds = [...currentIds, r.id];
                                                                            }
                                                                            handleTrialChange(idx, 'allowed_restaurant_ids', newIds.join(', '));
                                                                        }}
                                                                        className={\`px-3 py-2 rounded-lg text-[13px] cursor-pointer flex items-center justify-between transition-colors \${isSelected ? 'bg-emerald-500/10 text-emerald-700 font-semibold' : 'hover:bg-surface-hover text-text-main'}\`}
                                                                    >
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium">{r.name || 'Unnamed Restaurant'}</span>
                                                                            <span className="text-[10px] text-text-muted font-mono">{r.id.substring(0,8)}...</span>
                                                                        </div>
                                                                        {isSelected && <CheckCircle size={14} className="text-emerald-600" />}
                                                                    </div>
                                                                );
                                                            })}
                                                        {allRestaurants.filter(r => (r.name || r.id).toLowerCase().includes((searchQueries[idx] || '').toLowerCase())).length === 0 && (
                                                            <div className="px-3 py-4 text-center text-[12px] text-text-muted">No restaurants found.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}`;

code = code.replace(oldSpecific, newSpecific);

fs.writeFileSync(file, code);
console.log('Searchable dropdown implemented!');
