import re

with open('e:/dev/growtez/tablekard/apps/super-admin/src/components/QuickCreateDrawer.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_str = "<form onSubmit={activeForm === 'user' ? handleCreateUser : handleCreateRestaurant} className=\"flex-1 flex flex-col gap-5\">"
start_idx = content.find(start_str)
end_str = "{error && ("
end_idx = content.find(end_str, start_idx)

if start_idx == -1 or end_idx == -1:
    print("Could not find start or end block")
    exit(1)

original_form = content[start_idx:end_idx]

new_form = """<form onSubmit={activeForm === 'user' ? handleCreateUser : handleCreateRestaurant} className="flex-1 flex flex-col gap-5">
                        {activeForm === 'user' ? (
                            <>
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="rahul@example.in"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                    />
                                    <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Email Address</label>
                                </div>
                                <div className="relative">
                                    <input
                                        type="password"
                                        placeholder={editingData ? "Leave empty to keep current" : "Min 6 characters"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingData}
                                        className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                    />
                                    <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Password</label>
                                </div>
                                <div className="relative">
                                    <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 transition-colors peer-focus:text-accent-primary">System Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        required
                                        className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none"
                                    >
                                        {roleOptions.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {['restaurant_admin', 'restaurant_staff'].includes(formData.role) && (
                                    <div className="relative">
                                        <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 transition-colors peer-focus:text-accent-primary">Restaurant Assignment</label>
                                        <select
                                            value={formData.restaurantId}
                                            onChange={(e) => setFormData({ ...formData, restaurantId: e.target.value })}
                                            required
                                            className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none"
                                        >
                                            <option value="">Select Restaurant</option>
                                            {restaurants.map(res => (
                                                <option key={res.id} value={res.id}>{res.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="The Bombay Spice"
                                        value={resFormData.name}
                                        onChange={(e) => setResFormData({ ...resFormData, name: e.target.value })}
                                        required
                                        className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                    />
                                    <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Restaurant Name</label>
                                </div>
                                <div className="relative">
                                    <div className="flex">
                                        <input
                                            type="text"
                                            placeholder="the-bombay-spice"
                                            value={resFormData.slug}
                                            onChange={(e) => setResFormData({ ...resFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                            required
                                            className="peer flex-1 bg-surface-hover border border-border border-r-0 rounded-l-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                        />
                                        <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Restaurant Slug (URL)</label>
                                        <span className="px-3 bg-surface border border-border border-l-0 rounded-r-xl text-text-muted text-sm flex items-center whitespace-nowrap z-20">.tablekard.com</span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="manager@bombayspice.in"
                                        value={resFormData.contact_email}
                                        onChange={(e) => setResFormData({ ...resFormData, contact_email: e.target.value })}
                                        required
                                        className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                    />
                                    <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Admin Email</label>
                                </div>
                                {!editingData && (
                                    <div className="relative">
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Set login password"
                                                value={resFormData.admin_password}
                                                onChange={(e) => setResFormData({ ...resFormData, admin_password: e.target.value })}
                                                required={!editingData}
                                                className="peer w-full bg-surface-hover border border-border rounded-xl px-4 pr-10 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                            />
                                            <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Admin Password</label>
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-text-muted cursor-pointer p-1.5 flex hover:text-text-main transition-colors z-20"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="MG Road, Bangalore"
                                        value={resFormData.contact_address}
                                        onChange={(e) => setResFormData({ ...resFormData, contact_address: e.target.value })}
                                        className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                    />
                                    <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Address</label>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="+91 98765 43210"
                                        value={resFormData.contact_phone}
                                        onChange={(e) => setResFormData({ ...resFormData, contact_phone: e.target.value })}
                                        className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                    />
                                    <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Phone Number</label>
                                </div>
                            </>
                        )}
                        """

content = content.replace(original_form, new_form)

with open('e:/dev/growtez/tablekard/apps/super-admin/src/components/QuickCreateDrawer.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement successful")
