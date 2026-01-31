
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  addDoc, 
  updateDoc 
} from 'firebase/firestore';
import { AdminTabs, AppConfig, Post, Milestone, User, WithdrawalRequest } from '../../types';

interface AdminLayoutProps {
  onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTabs>(AdminTabs.DASHBOARD);
  
  const [config, setConfig] = useState<AppConfig>({ reward: 20.00, limit: 50, minRef: 30, minAmt: 500 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);

  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [postFormData, setPostFormData] = useState({
    title: '', thumb: '', zone: '', ads: '5', link: ''
  });

  useEffect(() => {
    // Sync Config
    const unsubConfig = onSnapshot(doc(db, 'settings', 'config'), (s) => {
      if (s.exists()) setConfig(s.data() as AppConfig);
    });

    // Sync Posts
    const unsubPosts = onSnapshot(collection(db, 'posts'), (s) => {
      setPosts(s.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    });

    // Sync Milestones
    const unsubMilestones = onSnapshot(collection(db, 'milestones'), (s) => {
      setMilestones(s.docs.map(d => ({ id: d.id, ...d.data() } as Milestone)));
    });

    // Sync Tasks
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (s) => {
      setTasks(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Sync Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (s) => {
      setUsers(s.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    });

    // Sync Withdrawals
    const unsubWithdraws = onSnapshot(collection(db, 'withdrawals'), (s) => {
      setWithdrawals(s.docs.map(d => ({ id: d.id, ...d.data() } as WithdrawalRequest)));
    });

    return () => {
      unsubConfig(); unsubPosts(); unsubMilestones(); unsubTasks(); unsubUsers(); unsubWithdraws();
    };
  }, []);

  const handleSaveConfig = async () => {
    try {
      await setDoc(doc(db, 'settings', 'config'), config);
      alert("Settings Updated!");
    } catch (e) { alert("Error saving settings."); }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...postFormData, ads: parseInt(postFormData.ads) };
    try {
      if (editPostId) {
        await updateDoc(doc(db, 'posts', editPostId), data);
        setEditPostId(null);
        alert("Post Updated!");
      } else {
        await addDoc(collection(db, 'posts'), data);
        alert("New Post Published!");
      }
      setPostFormData({ title: '', thumb: '', zone: '', ads: '5', link: '' });
      setActiveTab(AdminTabs.POST_LIST);
    } catch (e) { alert("Action failed."); }
  };

  const startEditPost = (post: Post) => {
    setEditPostId(post.id!);
    setPostFormData({
      title: post.title,
      thumb: post.thumb,
      zone: post.zone,
      ads: post.ads.toString(),
      link: post.link
    });
    setActiveTab(AdminTabs.ADD_POST);
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as any;
    try {
      await addDoc(collection(db, 'milestones'), {
        count: parseInt(target.count.value),
        bonus: parseFloat(target.bonus.value)
      });
      target.reset();
    } catch (e) { alert("Milestone add failed."); }
  };

  const updateTask = async (id: string, title: string, zone: string) => {
    try {
      await updateDoc(doc(db, 'tasks', id), { title, zone });
      alert("Task Updated!");
    } catch (e) { alert("Task update failed."); }
  };

  const deleteItem = async (col: string, id: string) => {
    if (confirm("Confirm delete?")) {
      try {
        await deleteDoc(doc(db, col, id));
      } catch (e) { alert("Delete failed."); }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <aside className="w-64 bg-indigo-900 text-white flex flex-col fixed h-full shadow-2xl z-40">
        <div className="p-6 border-b border-indigo-800">
          <h2 className="text-xl font-black italic tracking-tighter uppercase">Admin Core</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {[
            { id: AdminTabs.DASHBOARD, icon: 'fa-home', label: 'Dashboard' },
            { id: AdminTabs.ADD_POST, icon: 'fa-plus-circle', label: editPostId ? 'Edit Post' : 'Add Post' },
            { id: AdminTabs.POST_LIST, icon: 'fa-list', label: 'All Content' },
            { id: AdminTabs.TASK_SETTINGS, icon: 'fa-tasks', label: 'Daily Tasks' },
            { id: AdminTabs.REFER_MILESTONE, icon: 'fa-gift', label: 'Milestones' },
            { id: AdminTabs.MANAGE_USERS, icon: 'fa-users', label: 'User Hub' },
            { id: AdminTabs.WITHDRAW_REQUESTS, icon: 'fa-wallet', label: 'Requests' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all ${
                activeTab === item.id ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-800 text-indigo-200'
              }`}
            >
              <i className={`fas ${item.icon} mr-3 w-5`}></i>
              <span className="font-bold text-xs uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-indigo-800">
          <button onClick={onLogout} className="w-full flex items-center p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all font-bold text-xs uppercase">
            <i className="fas fa-sign-out-alt mr-3"></i> Exit System
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <header className="bg-white border-b sticky top-0 z-30 flex items-center justify-between px-10 py-4">
          <h1 className="text-xl font-black text-gray-800 uppercase tracking-tight">{activeTab.replace('-', ' ')}</h1>
          <div className="flex items-center text-[10px] font-black text-green-500 bg-green-50 px-4 py-1.5 rounded-full border border-green-100 uppercase">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Cloud Sync Active
          </div>
        </header>

        <div className="p-10 max-w-6xl mx-auto">
          {activeTab === AdminTabs.DASHBOARD && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border">
                <h3 className="text-sm font-black text-indigo-900 mb-6 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-video"></i> Reward Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase">Default Reward (৳)</label>
                    <input type="number" className="w-full mt-1 p-3 bg-gray-50 border rounded-xl font-bold" value={config.reward} onChange={(e) => setConfig({...config, reward: parseFloat(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase">Daily Video Limit</label>
                    <input type="number" className="w-full mt-1 p-3 bg-gray-50 border rounded-xl font-bold" value={config.limit} onChange={(e) => setConfig({...config, limit: parseInt(e.target.value)})} />
                  </div>
                  <button onClick={handleSaveConfig} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-black text-xs uppercase shadow-xl shadow-indigo-100">Sync Config</button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] shadow-sm border">
                <h3 className="text-sm font-black text-indigo-900 mb-6 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-shield-alt"></i> Withdrawal Rules</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase">Minimum Referrals</label>
                    <input type="number" className="w-full mt-1 p-3 bg-gray-50 border rounded-xl font-bold" value={config.minRef} onChange={(e) => setConfig({...config, minRef: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase">Min Cashout (৳)</label>
                    <input type="number" className="w-full mt-1 p-3 bg-gray-50 border rounded-xl font-bold" value={config.minAmt} onChange={(e) => setConfig({...config, minAmt: parseInt(e.target.value)})} />
                  </div>
                  <button onClick={handleSaveConfig} className="w-full bg-green-600 text-white p-4 rounded-xl font-black text-xs uppercase shadow-xl shadow-green-100">Save Rules</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === AdminTabs.ADD_POST && (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border max-w-2xl mx-auto">
               <h3 className="font-black text-gray-800 mb-8 uppercase text-xs tracking-widest">{editPostId ? 'Modify Premium Content' : 'Push New Content'}</h3>
               <form onSubmit={handlePostSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase">Content Title</label>
                    <input value={postFormData.title} onChange={e => setPostFormData({...postFormData, title: e.target.value})} required className="w-full mt-1 p-3 bg-gray-50 border rounded-xl font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase">Thumbnail URL</label>
                    <input value={postFormData.thumb} onChange={e => setPostFormData({...postFormData, thumb: e.target.value})} required className="w-full mt-1 p-3 bg-gray-50 border rounded-xl font-mono text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase">Ad Zone ID</label>
                      <input value={postFormData.zone} onChange={e => setPostFormData({...postFormData, zone: e.target.value})} required className="w-full mt-1 p-3 bg-gray-50 border rounded-xl font-bold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase">Ads Count</label>
                      <input value={postFormData.ads} onChange={e => setPostFormData({...postFormData, ads: e.target.value})} required type="number" className="w-full mt-1 p-3 bg-gray-50 border rounded-xl font-bold" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase">Final Destination Link</label>
                    <input value={postFormData.link} onChange={e => setPostFormData({...postFormData, link: e.target.value})} required className="w-full mt-1 p-3 bg-gray-50 border rounded-xl font-mono text-xs" />
                  </div>
                  <div className="flex gap-4 pt-6">
                    {editPostId && <button type="button" onClick={() => { setEditPostId(null); setPostFormData({title:'',thumb:'',zone:'',ads:'5',link:''}); }} className="px-6 bg-gray-100 text-gray-500 rounded-xl font-black text-[10px] uppercase">Cancel</button>}
                    <button type="submit" className="flex-1 bg-indigo-600 text-white p-4 rounded-xl font-black text-xs uppercase shadow-xl hover:opacity-90">
                      {editPostId ? 'Update Data' : 'Launch Content'}
                    </button>
                  </div>
               </form>
            </div>
          )}

          {activeTab === AdminTabs.POST_LIST && (
            <div className="bg-white rounded-[2rem] shadow-sm border overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                      <th className="p-6">Content</th>
                      <th className="p-6">Ad Config</th>
                      <th className="p-6 text-right">Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {posts.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-6 flex items-center gap-4">
                          <img src={p.thumb} className="w-14 h-14 object-cover rounded-xl border bg-gray-100" />
                          <div>
                            <div className="font-black text-gray-800">{p.title}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-1">{p.link.substring(0, 30)}...</div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">{p.ads} ADS / {p.zone}</span>
                        </td>
                        <td className="p-6 text-right space-x-2">
                           <button onClick={() => startEditPost(p)} className="text-indigo-600 font-black text-[10px] uppercase hover:underline">Edit</button>
                           <button onClick={() => deleteItem('posts', p.id!)} className="text-red-500 font-black text-[10px] uppercase hover:underline">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          {activeTab === AdminTabs.TASK_SETTINGS && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {tasks.length === 0 && <div className="p-10 text-center col-span-2 text-gray-400 font-bold uppercase text-xs">No tasks added yet.</div>}
              {tasks.map(task => (
                <div key={task.id} className="bg-white p-8 rounded-[2rem] shadow-sm border">
                  <h3 className="font-black text-indigo-900 mb-6 uppercase text-[10px] tracking-[0.2em] border-b pb-3">Daily Task ID: {task.id}</h3>
                  <div className="space-y-4">
                    <input id={`t${task.id}-title`} defaultValue={task.title} className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                    <input id={`t${task.id}-zone`} defaultValue={task.zone} className="w-full p-3 bg-gray-50 border rounded-xl font-mono text-xs" />
                    <button onClick={() => {
                      const title = (document.getElementById(`t${task.id}-title`) as HTMLInputElement).value;
                      const zone = (document.getElementById(`t${task.id}-zone`) as HTMLInputElement).value;
                      updateTask(task.id, title, zone);
                    }} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-black text-xs uppercase">Save Changes</button>
                  </div>
                </div>
              ))}
              <div className="bg-white p-8 rounded-[2rem] border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50" 
                   onClick={async () => await addDoc(collection(db, 'tasks'), { title: 'New Task', zone: 'ZONE_ID' })}>
                <span className="font-black text-gray-300 uppercase text-[10px] tracking-widest">+ Add New Task Node</span>
              </div>
            </div>
          )}

          {activeTab === AdminTabs.REFER_MILESTONE && (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border max-w-2xl mx-auto">
               <h3 className="font-black text-gray-800 mb-8 uppercase text-xs tracking-widest text-center">Referral Program Config</h3>
               <form onSubmit={handleAddMilestone} className="flex gap-4 items-end mb-10">
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Referral Count</label>
                    <input name="count" type="number" required className="w-full mt-1 p-3 bg-gray-50 border rounded-xl font-bold" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Reward (৳)</label>
                    <input name="bonus" type="number" required className="w-full mt-1 p-3 bg-gray-50 border rounded-xl font-bold" />
                  </div>
                  <button type="submit" className="bg-green-600 text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase shadow-xl shadow-green-100">Add</button>
               </form>
               <div className="space-y-3">
                  {milestones.sort((a,b) => a.count - b.count).map(m => (
                    <div key={m.id} className="p-5 bg-gray-50 border flex justify-between items-center rounded-2xl">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-xs">{m.count}</div>
                          <span className="font-black text-gray-700 uppercase text-[10px] tracking-widest">৳{m.bonus.toFixed(2)} Bonus</span>
                       </div>
                       <button onClick={() => deleteItem('milestones', m.id!)} className="text-red-500 font-black text-[10px] uppercase hover:underline">Delete</button>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === AdminTabs.MANAGE_USERS && (
            <div className="bg-white rounded-[2rem] shadow-sm border overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                      <th className="p-6">User Identity</th>
                      <th className="p-6">Assets</th>
                      <th className="p-6">Impact</th>
                      <th className="p-6 text-right">Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="p-6">
                          <div className="font-black text-gray-800">ID: {u.id}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase">{u.phone || 'New Account'}</div>
                        </td>
                        <td className="p-6">
                          <div className="font-black text-green-600">৳{u.balance?.toFixed(2) || '0.00'}</div>
                        </td>
                        <td className="p-6">
                          <div className="font-black text-indigo-600 uppercase text-[10px]">{u.totalRefer || 0} Successful Refers</div>
                        </td>
                        <td className="p-6 text-right">
                          <button onClick={() => deleteItem('users', u.id)} className="text-red-500 font-black text-[10px] uppercase hover:underline">Block & Wipe</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          {activeTab === AdminTabs.WITHDRAW_REQUESTS && (
            <div className="bg-white rounded-[2rem] shadow-sm border overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                      <th className="p-6">Destination</th>
                      <th className="p-6">Sum</th>
                      <th className="p-6">State</th>
                      <th className="p-6 text-right">Operation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {withdrawals.map(w => (
                      <tr key={w.id}>
                        <td className="p-6">
                          <div className="font-black text-gray-800 uppercase text-xs">{w.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-1">{w.number}</div>
                        </td>
                        <td className="p-6 font-black text-indigo-700">৳{w.amount.toFixed(2)}</td>
                        <td className="p-6">
                          <span className="bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{w.status}</span>
                        </td>
                        <td className="p-6 text-right">
                          <button onClick={() => deleteItem('withdrawals', w.id!)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-indigo-100">Approve & Pay</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
