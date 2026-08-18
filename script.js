const fs = require('fs');
let c = fs.readFileSync('E:/dev/growtez/tablekard-all/tablekard/apps/super-admin/src/pages/QrTokens.tsx', 'utf8');

c = c.replace(/status: 'available' \| 'assigned';/, "status: 'available' | 'assigned' | 'trashed';");
c = c.replace(/useState<'physical' \| 'auto_generated'>\('physical'\);/, "useState<'physical' | 'auto_generated' | 'trashed'>('physical');");
c = c.replace(/useState<'all' \| 'available' \| 'assigned'>\('all'\);/, "useState<'all' | 'available' | 'assigned' | 'trashed'>('all');");
c = c.replace(/useState<QrToken \| null>\(null\);/, "useState<QrToken | null>(null);\n    const [restoreTarget, setRestoreTarget] = useState<QrToken | null>(null);\n    const [restoring, setRestoring] = useState(false);");

const oldFilter =     const filtered = tokens.filter(t => {
        const isAuto = t.is_auto_generated === true;
        if (tokenTypeTab === 'physical' && isAuto) return false;
        if (tokenTypeTab === 'auto_generated' && !isAuto) return false;

        if (statusFilter !== 'all' && t.status !== statusFilter) return false;;
const newFilter =     const filtered = tokens.filter(t => {
        const isAuto = t.is_auto_generated === true;
        const isTrash = t.status === 'trashed';

        if (tokenTypeTab === 'trashed' && !isTrash) return false;
        if (tokenTypeTab !== 'trashed' && isTrash) return false;

        if (tokenTypeTab === 'physical' && isAuto) return false;
        if (tokenTypeTab === 'auto_generated' && !isAuto) return false;

        if (statusFilter !== 'all' && t.status !== statusFilter) return false;;
c = c.replace(oldFilter, newFilter);

const oldDelete =         } finally {
            setDeleting(false);
        }
    };;
const newRestore =         } finally {
            setDeleting(false);
        }
    };

    const handleRestore = async () => {
        if (!restoreTarget) return;
        setRestoring(true);
        try {
            const { error: resErr } = await supabase
                .from('qr_code_tokens')
                .update({ status: 'available' })
                .eq('id', restoreTarget.id);
            if (resErr) throw resErr;

            await fetchTokens();
            setRestoreTarget(null);
        } catch (err: any) {
            setError('Failed to restore token: ' + err.message);
        } finally {
            setRestoring(false);
        }
    };;
c = c.replace(oldDelete, newRestore);

const oldListBtns =                                                         {token.status === 'assigned' && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setUnlinkTarget(token); }}
                                                                className=\"px-2.5 py-1.5 text-xs rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors\"
                                                                title=\"Unlink from table\"
                                                            >
                                                                <Unlink size={12} />
                                                            </button>
                                                        )};
const newListBtns =                                                         {token.status === 'trashed' ? (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setRestoreTarget(token); }}
                                                                className=\"px-2.5 py-1.5 text-xs rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors\"
                                                                title=\"Restore token\"
                                                            >
                                                                <RefreshCw size={12} />
                                                            </button>
                                                        ) : (
                                                            token.status === 'assigned' && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setUnlinkTarget(token); }}
                                                                    className=\"px-2.5 py-1.5 text-xs rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors\"
                                                                    title=\"Unlink from table\"
                                                                >
                                                                    <Unlink size={12} />
                                                                </button>
                                                            )
                                                        )};
c = c.replace(oldListBtns, newListBtns);

const oldGridBtns =                                                 {token.status === 'assigned' && (
                                                    <button
                                                        onClick={() => setUnlinkTarget(token)}
                                                        className=\"px-2.5 py-1.5 text-xs rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors\"
                                                    >
                                                        <Unlink size={12} />
                                                    </button>
                                                )};
const newGridBtns =                                                 {token.status === 'trashed' ? (
                                                    <button
                                                        onClick={() => setRestoreTarget(token)}
                                                        className=\"px-2.5 py-1.5 text-xs rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors\"
                                                        title=\"Restore token\"
                                                    >
                                                        <RefreshCw size={12} />
                                                    </button>
                                                ) : (
                                                    token.status === 'assigned' && (
                                                        <button
                                                            onClick={() => setUnlinkTarget(token)}
                                                            className=\"px-2.5 py-1.5 text-xs rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors\"
                                                        >
                                                            <Unlink size={12} />
                                                        </button>
                                                    )
                                                )};
c = c.replace(oldGridBtns, newGridBtns);

const modalHTML =             {/* -- Restore Confirm Modal -- */}
            {restoreTarget && createPortal(
                <div className=\"fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4\" onClick={() => setRestoreTarget(null)}>
                    <div className=\"bg-surface border border-border rounded-2xl w-full max-w-sm shadow-2xl\" onClick={e => e.stopPropagation()}>
                        <div className=\"p-6\">
                            <div className=\"flex items-center gap-3 mb-4\">
                                <div className=\"w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center\">
                                    <RefreshCw size={18} className=\"text-green-500\" />
                                </div>
                                <h2 className=\"font-bold text-text-main\">Restore Token</h2>
                            </div>
                            <p className=\"text-sm text-text-muted mb-1\">
                                Are you sure you want to restore token <span className=\"font-mono font-semibold text-text-main\">{restoreTarget.token}</span>?
                            </p>
                            <p className=\"text-xs text-green-500 mt-3\">This will make it available again.</p>
                        </div>
                        <div className=\"flex gap-3 px-6 py-4 border-t border-border\">
                            <button onClick={() => setRestoreTarget(null)} className=\"flex-1 py-2 rounded-lg border border-border text-sm text-text-muted hover:bg-surface-hover transition-colors\">Cancel</button>
                            <button
                                onClick={handleRestore}
                                disabled={restoring}
                                className=\"flex-1 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2\"
                            >
                                {restoring ? <Loader2 size={16} className=\"animate-spin\" /> : 'Restore'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* -- Delete Confirm Modal -- */};
c = c.replace('            {/* -- Delete Confirm Modal -- */}', modalHTML);

c = c.replace(/token\.status === 'available' \? 'text-green-600' : 'text-blue-600'/g, "token.status === 'available' ? 'text-green-600' : token.status === 'trashed' ? 'text-gray-500' : 'text-blue-600'");
c = c.replace(/detailToken\.status === 'available' \? 'bg-green-500\/10 text-green-600' : 'bg-blue-500\/10 text-blue-600'/g, "detailToken.status === 'available' ? 'bg-green-500/10 text-green-600' : detailToken.status === 'trashed' ? 'bg-gray-500/10 text-gray-500' : 'bg-blue-500/10 text-blue-600'");

fs.writeFileSync('E:/dev/growtez/tablekard-all/tablekard/apps/super-admin/src/pages/QrTokens.tsx', c);
