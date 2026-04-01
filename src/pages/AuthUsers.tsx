import { useState, useEffect } from "react";
import { useProjectStore } from "../store/projectStore";
import { createSupabaseClient } from "../lib/supabase";
import { ResizablePanel } from "../components/ResizablePanel";

export default function AuthUsers() {
  const [search, setSearch] = useState("");
  const { projectUrl, serviceKey } = useProjectStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      if (!projectUrl || !serviceKey) return;
      setLoading(true);
      try {
        const supabase = createSupabaseClient(projectUrl, serviceKey);
        const { data, error } = await supabase.auth.admin.listUsers();
        if (error) {
          console.error("Error fetching users:", error);
        } else if (data && data.users) {
          setUsers(data.users);
          if (data.users.length > 0) {
            setSelectedUserId(data.users[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [projectUrl, serviceKey]);

  const selectedUser = users.find(u => u.id === selectedUserId) || users[0];

  const getProviderColor = (provider: string) => {
    if (provider.includes('google')) return "bg-blue-900/30 text-blue-400";
    if (provider.includes('github')) return "bg-purple-900/30 text-purple-400";
    if (provider.includes('phone')) return "bg-amber-900/30 text-amber-500";
    return "bg-slate-700/50 text-slate-300"; // email/default
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) || 
    u.id.includes(search)
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-background font-sans">
      
      {/* 1. Left Sub-Panel: Navigation */}
      <ResizablePanel side="left" defaultWidth={200} minWidth={160} maxWidth={300} className="bg-surface-container-lowest flex flex-col border-r border-white/5">
        <div className="h-10 px-4 flex items-center border-b border-white/5">
          <span className="text-[10px] font-bold text-[#5c5b5b] uppercase tracking-widest font-mono">Authentication</span>
        </div>
        <nav className="flex-1 py-4 space-y-1">
          <a className="px-4 py-2 flex items-center gap-3 text-primary bg-surface-container border-l-2 border-primary shadow-glow cursor-pointer text-sm font-medium">
            <span className="material-symbols-outlined text-[16px]">group</span>
            Users
          </a>
          <a className="px-4 py-2 flex items-center gap-3 text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm">
            <span className="material-symbols-outlined text-[16px]">policy</span>
            Policies
          </a>
        </nav>
      </ResizablePanel>

      {/* 2. Center Panel: Users List */}
      <section className="flex-1 bg-surface-container flex flex-col overflow-hidden">
        {/* Toolbar */}
        <header className="p-6 border-b border-white/5 shrink-0 bg-[#131313]">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-light tracking-tight text-white headline-sm">Users</h1>
            <button className="bg-primary text-background px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:brightness-110 transition-all shadow-glow">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
              Invite User
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5b5b]">search</span>
              <input 
                className="w-full bg-[#1c1b1b] border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-slate-200 placeholder:text-[#5c5b5b] font-mono outline-none transition-colors" 
                placeholder="Search by email, name or ID..." 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Users Table */}
        <div className="flex-1 overflow-auto scrollbar-hide bg-[#141414]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.1em] text-[#5c5b5b] font-mono border-b border-white/5 sticky top-0 bg-[#141414] z-10">
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Provider</th>
                <th className="px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3 font-medium">Last Sign In</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[12px]">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-6 text-zinc-500 font-mono">Loading users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-zinc-500 font-mono">No users found</td></tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUserId === user.id;
                  const provider = user.app_metadata?.provider || 'email';
                  const isBanned = !!user.banned_until;
                  const initial = (user.email || 'U')[0].toUpperCase();
                  
                  return (
                    <tr 
                      key={user.id} 
                      onClick={() => setSelectedUserId(user.id)}
                      className={`group hover:bg-surface-container-highest cursor-pointer transition-colors h-[36px] ${isSelected ? 'bg-primary/5 border-l-2 border-primary shadow-glow' : isBanned ? 'bg-error/5' : ''}`}
                    >
                      <td className={`px-6 py-2 ${isSelected ? 'pl-5' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full bg-secondary-container text-primary flex items-center justify-center text-[9px] font-bold ${isSelected ? 'shadow-glow' : ''}`}>{initial}</div>
                          <span className="font-mono text-[13px] text-slate-200">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest ${getProviderColor(provider)}`}>
                          {provider}
                        </span>
                      </td>
                      <td className="px-6 py-2 text-[12px] text-slate-400 font-mono">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-2 text-[12px] text-slate-400 font-mono">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</td>
                      <td className="px-6 py-2">
                        <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${isBanned ? 'text-error' : 'text-primary'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full bg-current ${!isBanned ? 'shadow-glow' : ''}`}></span> 
                          {isBanned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Right Panel: Stats & Detail */}
      <ResizablePanel side="right" defaultWidth={380} minWidth={280} maxWidth={500} className="bg-background flex flex-col border-l border-white/5">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-px bg-white/5 border-b border-white/5 shrink-0">
          <div className="bg-background p-4 text-center">
            <div className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono mb-1">Total Users</div>
            <div className="text-xl font-light text-primary font-mono">{users.length}</div>
          </div>
          <div className="bg-background p-4 text-center border-l border-white/5">
            <div className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono mb-1">Active Now</div>
            <div className="text-xl font-light text-primary font-mono">0</div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto scrollbar-hide">
          {!selectedUser ? (
             <div className="text-center text-zinc-500 font-mono mt-10 text-xs">No user selected</div>
          ) : (
            <>
              {/* User Identity */}
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-secondary-container text-primary flex items-center justify-center text-3xl font-bold mb-4 shadow-glow">
                  {(selectedUser.email || 'U')[0].toUpperCase()}
                </div>
                <h2 className="text-lg font-medium text-white mb-2 font-mono truncate w-full">{selectedUser.email}</h2>
                <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-lg border border-white/5 group">
                  <span className="text-[11px] font-mono text-slate-400 truncate w-48">{selectedUser.id}</span>
                  <button className="text-slate-500 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  </button>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono block mb-1">Provider</label>
                    <div className="text-sm text-slate-200 capitalize">{selectedUser.app_metadata?.provider || 'Unknown'}</div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono block mb-1">Status</label>
                    <div className={`text-sm font-medium uppercase tracking-widest font-mono ${selectedUser.banned_until ? 'text-error' : 'text-primary'}`}>
                       {selectedUser.banned_until ? 'Banned' : 'Active'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono block mb-1">Created At</label>
                    <div className="text-sm text-slate-200 font-mono">{new Date(selectedUser.created_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono block mb-1">Last Sign In</label>
                    <div className="text-sm text-slate-200 font-mono">{selectedUser.last_sign_in_at ? new Date(selectedUser.last_sign_in_at).toLocaleString() : 'Never'}</div>
                  </div>
                </div>

                {/* JSON Viewer */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono">Metadata</label>
                    <button className="text-[10px] font-mono text-primary hover:underline">Expand All</button>
                  </div>
                  <div className="bg-surface-container rounded-lg p-3 font-mono text-[11px] text-slate-400 border border-white/5 max-h-[150px] overflow-auto">
                    <pre>{JSON.stringify(selectedUser.user_metadata || {}, null, 2)}</pre>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <button 
                    onClick={async () => {
                      if (!projectUrl || !serviceKey || !selectedUser.email) return;
                      try {
                        const supabase = createSupabaseClient(projectUrl, serviceKey);
                        const { error } = await supabase.auth.admin.generateLink({
                          type: 'recovery',
                          email: selectedUser.email
                        });
                        if (error) throw error;
                        alert(`Recovery link generated and sent to ${selectedUser.email} (if SMTP is configured)`);
                      } catch (err: any) {
                        alert(`Failed to send reset: ${err.message}`);
                      }
                    }}
                    className="w-full h-8 px-4 rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-colors text-xs font-medium text-slate-200 text-center flex items-center justify-center cursor-pointer"
                  >
                    Send Password Reset
                  </button>
                  <button 
                    onClick={async () => {
                      if (!projectUrl || !serviceKey) return;
                      const isBanned = !!selectedUser.banned_until;
                      const newBanDuration = isBanned ? 'none' : '876000h'; // 100 years
                      
                      try {
                        const supabase = createSupabaseClient(projectUrl, serviceKey);
                        const { error, data } = await supabase.auth.admin.updateUserById(selectedUser.id, {
                          ban_duration: newBanDuration
                        });
                        if (error) throw error;
                        
                        // Update local state
                        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, banned_until: data.user.banned_until } : u));
                      } catch (err: any) {
                        alert(`Failed to update ban status: ${err.message}`);
                      }
                    }}
                    className={`w-full h-8 px-4 rounded-lg border transition-colors text-xs font-medium text-center flex items-center justify-center cursor-pointer ${
                      selectedUser.banned_until 
                        ? 'border-primary/30 hover:bg-primary/10 text-primary' 
                        : 'border-error/30 hover:bg-error/10 text-error'
                    }`}
                  >
                    {selectedUser.banned_until ? 'Unban User' : 'Ban User'}
                  </button>
                  <button 
                    onClick={async () => {
                      if (!projectUrl || !serviceKey) return;
                      const confirmDelete = window.confirm(`Are you sure you want to permanently delete ${selectedUser.email}?`);
                      if (!confirmDelete) return;
                      
                      try {
                        const supabase = createSupabaseClient(projectUrl, serviceKey);
                        const { error } = await supabase.auth.admin.deleteUser(selectedUser.id);
                        if (error) throw error;
                        
                        // Remove from local state
                        const updatedUsers = users.filter(u => u.id !== selectedUser.id);
                        setUsers(updatedUsers);
                        if (updatedUsers.length > 0) {
                          setSelectedUserId(updatedUsers[0].id);
                        } else {
                          setSelectedUserId(null);
                        }
                      } catch (err: any) {
                        alert(`Failed to delete user: ${err.message}`);
                      }
                    }}
                    className="w-full h-8 px-4 rounded-lg bg-error/10 hover:bg-error/20 transition-colors text-xs font-medium text-error text-center flex items-center justify-center cursor-pointer"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </ResizablePanel>
    </div>
  );
}
