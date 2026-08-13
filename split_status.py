file_path = "E:/dev/growtez/tablekard-all/tablekard/apps/super-admin/src/pages/Restaurants.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the single handleStatusChange with handleAccountStatusChange and handleSubscriptionChange
import re

handle_status_change_old = """    const handleStatusChange = async (resId: string, newStatusVal: string) => {
        let status = newStatusVal;
        let subType;
        let subStatus;
        const updates: any = {};

        if (newStatusVal.startsWith('active-trial-')) {
            const trialId = newStatusVal.replace('active-trial-', '');
            const selectedTrial = trialPlans.find(t => t.id === trialId);
            status = 'active';
            subType = selectedTrial ? selectedTrial.name : 'trial plan';
            subStatus = false;

            if (selectedTrial) {
                const endsAt = new Date();
                const days = selectedTrial.duration_days || 14;
                endsAt.setDate(endsAt.getDate() + days);
                (updates as any).subscription_end_at = endsAt.toISOString();
            }
        } else if (newStatusVal.startsWith('active-plan-')) {
            const planId = newStatusVal.replace('active-plan-', '');
            const selectedPlan = billingPlans.find(p => p.id === planId);
            status = 'active';
            subType = selectedPlan ? selectedPlan.name : 'paid plan';
            subStatus = true;
            
            if (selectedPlan) {
                const endsAt = new Date();
                const durationMonths = selectedPlan.duration || 1;
                endsAt.setMonth(endsAt.getMonth() + durationMonths);
                (updates as any).subscription_end_at = endsAt.toISOString();
            }
        } else if (newStatusVal === 'active-custom') {
            status = 'active';
            subStatus = true;
        } else {
            status = newStatusVal;
        }

        updates.status = status;
        if (subType !== undefined) {
            updates.subscription_plan = subType;
            updates.subscription_status = subStatus;
        }

        // Optimistic update
        setRestaurants(prev => prev.map(r => r.id === resId ? { ...r, ...updates } : r));

        try {
            const { error: updateError } = await supabase
                .from('restaurants')
                .update(updates)
                .eq('id', resId);
            
            if (updateError) throw updateError;
        } catch (err) {
            console.error('Error updating status:', err);
            fetchRestaurants(); // revert on error
        }
    };"""

handle_status_change_new = """    const handleAccountStatusChange = async (resId: string, status: string) => {
        const updates = { status };
        setRestaurants(prev => prev.map(r => r.id === resId ? { ...r, ...updates } : r));
        try {
            const { error: updateError } = await supabase.from('restaurants').update(updates).eq('id', resId);
            if (updateError) throw updateError;
        } catch (err) {
            console.error('Error updating account status:', err);
            fetchRestaurants();
        }
    };

    const handleSubscriptionChange = async (resId: string, newStatusVal: string) => {
        const updates: any = {};
        let subType = null;
        let subStatus = 'INACTIVE';
        
        if (newStatusVal === 'none') {
            updates.subscription_end_at = null;
        } else if (newStatusVal.startsWith('active-trial-')) {
            const trialId = newStatusVal.replace('active-trial-', '');
            const selectedTrial = trialPlans.find(t => t.id === trialId);
            subType = selectedTrial ? selectedTrial.name : 'trial plan';
            subStatus = 'TRIAL';
            if (selectedTrial) {
                const endsAt = new Date();
                const days = selectedTrial.duration_days || 14;
                endsAt.setDate(endsAt.getDate() + days);
                updates.subscription_end_at = endsAt.toISOString();
            }
        } else if (newStatusVal.startsWith('active-plan-')) {
            const planId = newStatusVal.replace('active-plan-', '');
            const selectedPlan = billingPlans.find(p => p.id === planId);
            subType = selectedPlan ? selectedPlan.name : 'paid plan';
            subStatus = 'ACTIVE';
            if (selectedPlan) {
                const endsAt = new Date();
                const durationMonths = selectedPlan.duration || 1;
                endsAt.setMonth(endsAt.getMonth() + durationMonths);
                updates.subscription_end_at = endsAt.toISOString();
            }
        } else if (newStatusVal === 'active-custom') {
            subStatus = 'ACTIVE';
        }

        updates.subscription_plan = subType;
        updates.subscription_status = subStatus;

        setRestaurants(prev => prev.map(r => r.id === resId ? { ...r, ...updates } : r));
        try {
            const { error: updateError } = await supabase.from('restaurants').update(updates).eq('id', resId);
            if (updateError) throw updateError;
        } catch (err) {
            console.error('Error updating subscription status:', err);
            fetchRestaurants();
        }
    };"""

content = content.replace(handle_status_change_old, handle_status_change_new)

# Table headers replacement
old_headers = """                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[25%]" onClick={() => toggleSort('status')}>
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    Status {getSortIcon('status')}
                                </div>
                            </th>"""

new_headers = """                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[15%]" onClick={() => toggleSort('status')}>
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    Rest Account Status {getSortIcon('status')}
                                </div>
                            </th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[15%]">
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    Subscription Status
                                </div>
                            </th>"""

content = content.replace(old_headers, new_headers)

# <td> replacement for desktop
old_td = """                                        <td className="py-2.5 px-4 align-middle actions-cell">
                                            <select 
                                                value={
                                                    res.status === 'active' 
                                                        ? (res.subscription_status === 'ACTIVE' || res.subscription_status === 'TRIAL'
                                                            ? (billingPlans.find(p => p.name?.toLowerCase() === res.subscription_plan?.toLowerCase())?.id 
                                                                ? `active-plan-${billingPlans.find(p => p.name?.toLowerCase() === res.subscription_plan?.toLowerCase()).id}` 
                                                                : 'active-custom')
                                                            : (trialPlans.find(t => t.name?.toLowerCase() === res.subscription_plan?.toLowerCase())?.id
                                                                ? `active-trial-${trialPlans.find(t => t.name?.toLowerCase() === res.subscription_plan?.toLowerCase()).id}`
                                                                : 'active-trial-14_days_trial'))
                                                        : (res.status || 'pending')
                                                }
                                                onChange={(e) => handleStatusChange(res.id, e.target.value)}
                                                className={`text-[11px] font-bold px-2 py-1 rounded border-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent-primary ${
                                                    res.status === 'active' ? 'bg-green-500/10 text-green-600' : 
                                                    res.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 
                                                    'bg-red-500/10 text-red-600'
                                                }`}
                                            >
                                                <option value="pending" className="text-amber-600 font-bold">PENDING</option>
                                                
                                                {trialPlans.map(trial => (
                                                    <option key={`active-trial-${trial.id}`} value={`active-trial-${trial.id}`} className="text-green-600 font-bold">
                                                        ACTIVE ({trial.name?.toUpperCase()})
                                                    </option>
                                                ))}
                                                
                                                {billingPlans.length > 0 ? (
                                                    billingPlans.map(plan => (
                                                        <option key={`active-plan-${plan.id}`} value={`active-plan-${plan.id}`} className="text-green-600 font-bold">
                                                            ACTIVE ({plan.name?.toUpperCase()})
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option value="active-plan-custom" className="text-green-600 font-bold">ACTIVE (PAID PLAN)</option>
                                                )}

                                                {res.status === 'active' && (res.subscription_status === 'ACTIVE' || res.subscription_status === 'TRIAL') && 
                                                 !billingPlans.some(p => p.name?.toLowerCase() === res.subscription_plan?.toLowerCase()) && (
                                                    <option value="active-custom" className="text-green-600 font-bold">ACTIVE ({res.subscription_plan?.toUpperCase() || 'CUSTOM'})</option>
                                                )}

                                                <option value="suspended" className="text-red-600 font-bold">SUSPENDED</option>
                                                <option value="rejected" className="text-red-600 font-bold">REJECTED</option>
                                            </select>
                                        </td>"""

new_td = """                                        <td className="py-2.5 px-4 align-middle actions-cell">
                                            <select 
                                                value={res.status || 'pending'}
                                                onChange={(e) => handleAccountStatusChange(res.id, e.target.value)}
                                                className={`text-[11px] font-bold px-2 py-1 rounded border-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent-primary ${
                                                    res.status === 'active' ? 'bg-green-500/10 text-green-600' : 
                                                    res.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 
                                                    'bg-red-500/10 text-red-600'
                                                }`}
                                            >
                                                <option value="pending" className="text-amber-600 font-bold">PENDING</option>
                                                <option value="active" className="text-green-600 font-bold">ACTIVE</option>
                                                <option value="suspended" className="text-red-600 font-bold">SUSPENDED</option>
                                                <option value="rejected" className="text-red-600 font-bold">REJECTED</option>
                                            </select>
                                        </td>
                                        <td className="py-2.5 px-4 align-middle actions-cell">
                                            <select 
                                                value={
                                                    (res.subscription_status === 'ACTIVE' || res.subscription_status === 'TRIAL')
                                                        ? (billingPlans.find(p => p.name?.toLowerCase() === res.subscription_plan?.toLowerCase())?.id 
                                                            ? `active-plan-${billingPlans.find(p => p.name?.toLowerCase() === res.subscription_plan?.toLowerCase())?.id}` 
                                                            : (trialPlans.find(t => t.name?.toLowerCase() === res.subscription_plan?.toLowerCase())?.id
                                                                ? `active-trial-${trialPlans.find(t => t.name?.toLowerCase() === res.subscription_plan?.toLowerCase())?.id}`
                                                                : 'active-custom'))
                                                        : 'none'
                                                }
                                                onChange={(e) => handleSubscriptionChange(res.id, e.target.value)}
                                                disabled={res.status !== 'active'}
                                                className={`text-[11px] font-bold px-2 py-1 rounded border border-border/50 cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent-primary bg-surface disabled:opacity-50`}
                                            >
                                                <option value="none">NO PLAN</option>
                                                {trialPlans.map(trial => (
                                                    <option key={`active-trial-${trial.id}`} value={`active-trial-${trial.id}`}>
                                                        TRIAL ({trial.name?.toUpperCase()})
                                                    </option>
                                                ))}
                                                {billingPlans.map(plan => (
                                                    <option key={`active-plan-${plan.id}`} value={`active-plan-${plan.id}`}>
                                                        PLAN ({plan.name?.toUpperCase()})
                                                    </option>
                                                ))}
                                                {(res.subscription_status === 'ACTIVE' || res.subscription_status === 'TRIAL') && 
                                                    !billingPlans.some(p => p.name?.toLowerCase() === res.subscription_plan?.toLowerCase()) && 
                                                    !trialPlans.some(t => t.name?.toLowerCase() === res.subscription_plan?.toLowerCase()) && (
                                                    <option value="active-custom">CUSTOM ({res.subscription_plan?.toUpperCase() || 'PLAN'})</option>
                                                )}
                                            </select>
                                        </td>"""

content = content.replace(old_td, new_td)

# <div> replacement for mobile
old_mobile = """                                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <select 
                                            value={
                                                res.status === 'active' 
                                                    ? (res.subscription_status === 'ACTIVE' || res.subscription_status === 'TRIAL'
                                                        ? (billingPlans.find(p => p.name?.toLowerCase() === res.subscription_plan?.toLowerCase())?.id 
                                                            ? `active-plan-${billingPlans.find(p => p.name?.toLowerCase() === res.subscription_plan?.toLowerCase()).id}` 
                                                            : 'active-custom')
                                                        : (trialPlans.find(t => t.name?.toLowerCase() === res.subscription_plan?.toLowerCase())?.id
                                                            ? `active-trial-${trialPlans.find(t => t.name?.toLowerCase() === res.subscription_plan?.toLowerCase()).id}`
                                                            : 'active-trial-14_days_trial'))
                                                    : (res.status || 'pending')
                                            }
                                            onChange={(e) => handleStatusChange(res.id, e.target.value)}
                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border border-border/40 cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent-primary ${
                                                res.status === 'active' ? 'bg-green-500/10 text-green-600' : 
                                                res.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 
                                                'bg-red-500/10 text-red-600'
                                            }`}
                                        >
                                            <option value="pending" className="text-amber-600 font-bold">PENDING</option>
                                            
                                            {trialPlans.map(trial => (
                                                <option key={`active-trial-${trial.id}`} value={`active-trial-${trial.id}`} className="text-green-600 font-bold">
                                                    ACTIVE ({trial.name?.toUpperCase()})
                                                </option>
                                            ))}
                                            
                                            {billingPlans.length > 0 ? (
                                                billingPlans.map(plan => (
                                                    <option key={`active-plan-${plan.id}`} value={`active-plan-${plan.id}`} className="text-green-600 font-bold">
                                                        ACTIVE ({plan.name?.toUpperCase()})
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="active-plan-custom" className="text-green-600 font-bold">ACTIVE (PAID PLAN)</option>
                                            )}

                                            {res.status === 'active' && (res.subscription_status === 'ACTIVE' || res.subscription_status === 'TRIAL') && 
                                                !billingPlans.some(p => p.name?.toLowerCase() === res.subscription_plan?.toLowerCase()) && (
                                                <option value="active-custom" className="text-green-600 font-bold">ACTIVE ({res.subscription_plan?.toUpperCase() || 'CUSTOM'})</option>
                                            )}

                                            <option value="suspended" className="text-red-600 font-bold">SUSPENDED</option>
                                            <option value="rejected" className="text-red-600 font-bold">REJECTED</option>
                                        </select>
                                    </div>"""

new_mobile = """                                    <div className="flex flex-col items-end gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <select 
                                            value={res.status || 'pending'}
                                            onChange={(e) => handleAccountStatusChange(res.id, e.target.value)}
                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border border-border/40 cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent-primary ${
                                                res.status === 'active' ? 'bg-green-500/10 text-green-600' : 
                                                res.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 
                                                'bg-red-500/10 text-red-600'
                                            }`}
                                        >
                                            <option value="pending" className="text-amber-600 font-bold">PENDING</option>
                                            <option value="active" className="text-green-600 font-bold">ACTIVE</option>
                                            <option value="suspended" className="text-red-600 font-bold">SUSPENDED</option>
                                            <option value="rejected" className="text-red-600 font-bold">REJECTED</option>
                                        </select>
                                        
                                        <select 
                                            value={
                                                (res.subscription_status === 'ACTIVE' || res.subscription_status === 'TRIAL')
                                                    ? (billingPlans.find(p => p.name?.toLowerCase() === res.subscription_plan?.toLowerCase())?.id 
                                                        ? `active-plan-${billingPlans.find(p => p.name?.toLowerCase() === res.subscription_plan?.toLowerCase())?.id}` 
                                                        : (trialPlans.find(t => t.name?.toLowerCase() === res.subscription_plan?.toLowerCase())?.id
                                                            ? `active-trial-${trialPlans.find(t => t.name?.toLowerCase() === res.subscription_plan?.toLowerCase())?.id}`
                                                            : 'active-custom'))
                                                    : 'none'
                                            }
                                            onChange={(e) => handleSubscriptionChange(res.id, e.target.value)}
                                            disabled={res.status !== 'active'}
                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border border-border/50 cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent-primary bg-surface disabled:opacity-50`}
                                        >
                                            <option value="none">NO PLAN</option>
                                            {trialPlans.map(trial => (
                                                <option key={`active-trial-${trial.id}`} value={`active-trial-${trial.id}`}>
                                                    TRIAL ({trial.name?.toUpperCase()})
                                                </option>
                                            ))}
                                            {billingPlans.map(plan => (
                                                <option key={`active-plan-${plan.id}`} value={`active-plan-${plan.id}`}>
                                                    PLAN ({plan.name?.toUpperCase()})
                                                </option>
                                            ))}
                                            {(res.subscription_status === 'ACTIVE' || res.subscription_status === 'TRIAL') && 
                                                !billingPlans.some(p => p.name?.toLowerCase() === res.subscription_plan?.toLowerCase()) && 
                                                !trialPlans.some(t => t.name?.toLowerCase() === res.subscription_plan?.toLowerCase()) && (
                                                <option value="active-custom">CUSTOM ({res.subscription_plan?.toUpperCase() || 'PLAN'})</option>
                                            )}
                                        </select>
                                    </div>"""

content = content.replace(old_mobile, new_mobile)

# Make sure there is colSpan 6 for the empty state
content = content.replace('colSpan={5}', 'colSpan={6}')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
