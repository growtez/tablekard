const fs = require('fs');

// 1. Update Plans.jsx (Super Admin)
const plansFile = 'apps/super-admin/src/pages/billing/Plans.jsx';
let plansCode = fs.readFileSync(plansFile, 'utf8');

// Update handleAddTrial defaults
plansCode = plansCode.replace(
  /is_public: false/g,
  "visibility: 'hidden',\n            allowed_restaurant_ids: ''"
);

// Update Render
const oldToggle = /<div className="pt-2">\s*<div className="flex items-center gap-2">\s*<input[^>]*id={`public-\$\{trial\.id\}`}[^>]*>\s*<label[^>]*>Show publicly to Restaurant Admins<\/label>\s*<\/div>\s*<p[^>]*>If unchecked, this trial is hidden and can only be assigned by a Super Admin\.<\/p>\s*<\/div>/g;

const newToggle = `<div className="pt-2 flex flex-col gap-3">
                                            <div>
                                                <label className="text-xs font-semibold text-text-muted">Visibility to Restaurant Admins</label>
                                                <select
                                                    value={trial.visibility || (trial.is_public ? 'global' : 'hidden')}
                                                    onChange={e => handleTrialChange(idx, 'visibility', e.target.value)}
                                                    className="mt-1 w-full text-[13px] px-3 py-2 rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-emerald-500"
                                                >
                                                    <option value="hidden">Hidden (Assign manually)</option>
                                                    <option value="global">Global (Show to all restaurants)</option>
                                                    <option value="specific">Specific Restaurants Only</option>
                                                </select>
                                            </div>
                                            {trial.visibility === 'specific' && (
                                                <div className="animate-fade-in">
                                                    <label className="text-xs font-semibold text-text-muted">Allowed Restaurant IDs (comma separated)</label>
                                                    <input 
                                                        value={trial.allowed_restaurant_ids || ''} 
                                                        onChange={e => handleTrialChange(idx, 'allowed_restaurant_ids', e.target.value)} 
                                                        placeholder="e.g. 5d1b32..., 9f8a2c..."
                                                        className="mt-1 w-full text-[13px] px-3 py-2 rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-emerald-500" 
                                                    />
                                                </div>
                                            )}
                                        </div>`;

plansCode = plansCode.replace(oldToggle, newToggle);
fs.writeFileSync(plansFile, plansCode);


// 2. Update subscription.tsx (Restaurant Admin)
const restFile = 'apps/restaurant-admin/src/pages/subscription/subscription.tsx';
let restCode = fs.readFileSync(restFile, 'utf8');

const oldFilter = `const publicTrials = config.trials.filter((t: any) => t.is_public === true);`;
const newFilter = `const publicTrials = config.trials.filter((t: any) => {
                        if (t.visibility === 'global') return true;
                        if (t.visibility === 'specific') {
                            const allowedIds = (t.allowed_restaurant_ids || '').split(',').map((id: string) => id.trim());
                            if (allowedIds.includes(activeRestaurantId)) return true;
                        }
                        if (t.visibility === undefined && t.is_public === true) return true; // Legacy fallback
                        return false;
                    });`;

restCode = restCode.replace(oldFilter, newFilter);
fs.writeFileSync(restFile, restCode);

console.log('Visibility updates applied globally.');
