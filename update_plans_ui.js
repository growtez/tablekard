const fs = require('fs');
let code = fs.readFileSync('apps/super-admin/src/pages/billing/Plans.jsx.mod', 'utf8');

const handlers = `
    const handleTrialChange = (index, field, value) => {
        const updated = [...editedTrials];
        updated[index][field] = value;
        setEditedTrials(updated);
    };
    
    const handleAddTrial = () => {
        const newTrial = {
            id: 'trial_' + Date.now(),
            name: 'New Trial',
            duration_days: 14
        };
        setEditedTrials([...editedTrials, newTrial]);
    };
    
    const handleDeleteTrial = (index) => {
        if (!window.confirm('Are you sure you want to delete this trial plan?')) return;
        const updated = editedTrials.filter((_, idx) => idx !== index);
        setEditedTrials(updated);
    };
`;
code = code.replace('const handlePlanChange = (index, field, value) => {', handlers + '\n    const handlePlanChange = (index, field, value) => {');

const read_only_trials = `
                    {trials.length > 0 && (
                        <div className="mb-10">
                            <h2 className="text-xl font-bold text-text-main mb-5 flex items-center gap-2"><Sparkles size={20} className="text-emerald-500" /> Free Trial Plans</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {trials.map(trial => (
                                    <div key={trial.id} className="relative bg-surface rounded-2xl p-6 border-2 border-emerald-500/20 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4"><Zap size={20} /></div>
                                        <h3 className="font-bold text-[16px] text-text-main mb-1">{trial.name}</h3>
                                        <div className="text-[13px] text-text-muted mb-4">{trial.duration_days} Days Free</div>
                                        <code className="text-[10px] text-text-muted bg-surface-hover px-1.5 py-0.5 rounded mt-auto border border-border">{trial.id}</code>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <h2 className="text-xl font-bold text-text-main mb-5 flex items-center gap-2"><Award size={20} className="text-accent-primary" /> Paid Subscription Packages</h2>
`;
code = code.replace('<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">', read_only_trials + '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">');


const edit_trials = `
                    <div className="mb-10">
                        <h2 className="text-xl font-bold text-text-main mb-5 flex items-center gap-2"><Sparkles size={20} className="text-emerald-500" /> Edit Free Trial Plans</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {editedTrials.map((trial, idx) => (
                                <div key={trial.id} className="bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6 relative animate-fade-in" style={{ border: '2px dashed #10b981' }}>
                                    <button onClick={() => handleDeleteTrial(idx)} className="absolute top-5 right-5 bg-red-500/10 text-red-600 border border-red-500/20 p-2 rounded-lg cursor-pointer hover:bg-red-500/20 transition-colors" title="Delete Trial"><Trash2 size={16} /></button>
                                    <h3 className="text-base font-bold mb-5 border-b border-border pb-2.5 flex items-center gap-2.5">
                                        <Badge style={{ background: '#10b981', color: 'white' }}>Trial #{idx + 1}</Badge>
                                        Editing {trial.name || 'Untitled Trial'}
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-text-muted">Trial Name</label>
                                            <input value={trial.name} onChange={e => handleTrialChange(idx, 'name', e.target.value)} className="mt-1 w-full text-[13px] px-3 py-2 rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-emerald-500" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-text-muted">Duration (Days)</label>
                                                <input type="number" value={trial.duration_days} onChange={e => handleTrialChange(idx, 'duration_days', parseInt(e.target.value) || 0)} className="mt-1 w-full text-[13px] px-3 py-2 rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-emerald-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-text-muted">Identifier Key (ID)</label>
                                                <input value={trial.id} onChange={e => handleTrialChange(idx, 'id', e.target.value)} className="mt-1 w-full text-[13px] px-3 py-2 rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-emerald-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div onClick={handleAddTrial} className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center min-h-[260px] cursor-pointer transition-colors bg-black/5 hover:border-emerald-500 hover:bg-emerald-500/5 group">
                                <Plus size={36} className="text-text-muted mb-3 group-hover:text-emerald-500 transition-colors" />
                                <span className="font-semibold text-[15px] text-text-main">Create New Trial</span>
                                <span className="text-xs text-text-muted mt-1">Add a free tier package</span>
                            </div>
                        </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-text-main mb-5 flex items-center gap-2"><Award size={20} className="text-accent-primary" /> Edit Paid Subscription Packages</h2>
`;
code = code.replace('<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">', edit_trials + '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">');

fs.writeFileSync('apps/super-admin/src/pages/billing/Plans.jsx', code);
