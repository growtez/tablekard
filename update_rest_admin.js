const fs = require('fs');
const file = 'apps/restaurant-admin/src/pages/subscription/subscription.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add Trial Interface and state
code = code.replace(
  'const [dbPlans, setDbPlans] = useState<Plan[]>(DEFAULT_PLANS);',
  'const [dbPlans, setDbPlans] = useState<Plan[]>(DEFAULT_PLANS);\n    const [dbTrials, setDbTrials] = useState<any[]>([]);'
);

// 2. Fetch Trials in loadData
const fetchRegex = /const config = data\?\.config as any;[\s\S]*?setDbPlans\(DEFAULT_PLANS\);\s*\}\s*\} catch \(plansErr\)/;
const newFetch = `const config = data?.config as any;
                if (config?.plans) {
                    const mapped = config.plans.map((p: any) => {
                        let fixedDuration = p.duration;
                        let fixedPrice = p.price;
                        if (p.id === '6_months' || fixedDuration === 5) {
                            fixedDuration = 6;
                            fixedPrice = 2699;
                        } else if (p.id === '12_months' || fixedDuration === 11) {
                            fixedDuration = 12;
                        }
                        return {
                            duration: fixedDuration,
                            label: p.name,
                            price: fixedPrice,
                            perMonth: Math.round(fixedPrice / fixedDuration),
                            savings: p.savings || 0,
                            popular: !!p.recommended
                        };
                    });
                    setDbPlans(mapped);
                } else {
                    setDbPlans(DEFAULT_PLANS);
                }

                if (config?.trials) {
                    const publicTrials = config.trials.filter((t: any) => t.is_public === true);
                    setDbTrials(publicTrials);
                } else {
                    setDbTrials([]);
                }
            } catch (plansErr)`;
code = code.replace(fetchRegex, newFetch);

// 3. Render Trials
const renderRegex = /<div className="mb-10">\s*<div className="text-center mb-6">\s*<h2 className="text-\[24px\] font-extrabold text-tk-text m-0 mb-2 tracking-tight">Choose the Perfect Plan<\/h2>/;
const newRender = `
            {dbTrials.length > 0 && (
                <div className="mb-10">
                    <div className="text-center mb-6">
                        <h2 className="text-[24px] font-extrabold text-tk-text m-0 mb-2 tracking-tight text-tk-success">Start Your Free Trial</h2>
                        <p className="text-[14px] text-tk-text-secondary m-0">Experience Tablekard risk-free before choosing a paid package.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[800px] mx-auto pt-2">
                        {dbTrials.map(trial => (
                            <div key={trial.id} className="bg-tk-bg-card border-2 border-tk-success/30 shadow-md hover:shadow-xl hover:border-tk-success/60 hover:-translate-y-1 transition-all rounded-[24px] p-8 text-center flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-tk-success/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                <h3 className="text-[18px] font-bold text-tk-text uppercase tracking-widest mb-3 relative z-10">{trial.name}</h3>
                                <div className="text-[48px] font-black leading-none text-tk-success relative z-10 mb-4">{trial.duration_days}</div>
                                <div className="text-[14px] font-semibold text-tk-text-secondary uppercase tracking-widest mb-8 relative z-10">Days Free Access</div>
                                <button
                                    onClick={() => alert('Trial activation flow goes here! Contacting backend...')}
                                    className="mt-auto w-full py-4 rounded-xl font-bold text-[14px] uppercase tracking-wider bg-tk-success text-white hover:bg-tk-success/90 shadow-md"
                                >
                                    Claim Trial
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mb-10">
                <div className="text-center mb-6">
                    <h2 className="text-[24px] font-extrabold text-tk-text m-0 mb-2 tracking-tight">Choose the Perfect Plan</h2>`;
code = code.replace(renderRegex, newRender);

fs.writeFileSync(file, code);
console.log('Restaurant admin subscription.tsx updated successfully.');
