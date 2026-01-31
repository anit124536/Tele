
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { 
  doc, 
  onSnapshot, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  collection, 
  addDoc 
} from 'firebase/firestore';
import { UserPages, Post, Milestone, WithdrawalRequest, AppConfig, User } from '../../types';

const UserLayout: React.FC = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<UserPages>(UserPages.HOME);
  
  // App Data State
  const [posts, setPosts] = useState<Post[]>([]);
  const [config, setConfig] = useState<AppConfig>({ reward: 20, limit: 50, minRef: 30, minAmt: 500 });
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  // User Profile State
  const [userData, setUserData] = useState<User | null>(null);
  const [userId, setUserId] = useState<string>(() => {
    const saved = localStorage.getItem('user_id');
    if (saved) return saved;
    const newId = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('user_id', newId);
    return newId;
  });

  useEffect(() => {
    // 1. Initialize/Sync User Profile
    const initUser = async () => {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const newUser: User = {
          id: userId,
          name: 'New User',
          phone: '',
          balance: 0,
          totalRefer: 0,
          referCode: userId
        };
        await setDoc(userRef, newUser);
        
        // Handle Referral logic if URL has ?ref=
        const urlParams = new URLSearchParams(window.location.search);
        const referrerId = urlParams.get('ref');
        if (referrerId && referrerId !== userId) {
          const referrerRef = doc(db, 'users', referrerId);
          const referrerSnap = await getDoc(referrerRef);
          if (referrerSnap.exists()) {
            await updateDoc(referrerRef, { totalRefer: increment(1) });
          }
        }
      }
    };
    initUser();

    // 2. Real-time User Sync
    const unsubUser = onSnapshot(doc(db, 'users', userId), (s) => {
      if (s.exists()) setUserData(s.data() as User);
    });

    // 3. Global App Config Sync
    const unsubConfig = onSnapshot(doc(db, 'settings', 'config'), (s) => {
      if (s.exists()) setConfig(s.data() as AppConfig);
    });

    // 4. Content Sync
    const unsubPosts = onSnapshot(collection(db, 'posts'), (s) => {
      setPosts(s.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    });

    const unsubTasks = onSnapshot(collection(db, 'tasks'), (s) => {
      setTasks(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMilestones = onSnapshot(collection(db, 'milestones'), (s) => {
      setMilestones(s.docs.map(d => ({ id: d.id, ...d.data() } as Milestone)));
    });

    return () => {
      unsubUser(); unsubConfig(); unsubPosts(); unsubTasks(); unsubMilestones();
    };
  }, [userId]);

  const handleWatchAd = async (type: string, rewardValue?: number) => {
    const amt = rewardValue ?? config.reward;
    alert(`Streaming Advertisement...`);
    
    setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'users', userId), {
          balance: increment(amt)
        });
        alert(`Success! ৳${amt.toFixed(2)} added to vault.`);
      } catch (e) { alert("Balance update failed. Check connection."); }
    }, 2000);
  };

  const submitWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as any;
    const amount = parseFloat(target.amount.value);
    
    if (userData!.totalRefer < config.minRef) {
      alert(`Min. ${config.minRef} refers required!`);
      return;
    }
    if (amount < config.minAmt) {
      alert(`Min. cashout is ৳${config.minAmt}`);
      return;
    }
    if (amount > userData!.balance) {
      alert("Insufficient funds!");
      return;
    }

    try {
      await addDoc(collection(db, 'withdrawals'), {
        userId,
        name: userData!.name,
        number: target.number.value,
        amount: amount,
        status: 'pending',
        timestamp: new Date().toISOString()
      });
      await updateDoc(doc(db, 'users', userId), {
        balance: increment(-amount)
      });
      alert("Withdrawal request sent!");
      target.reset();
    } catch (e) { alert("Transaction failed."); }
  };

  const copyRefLink = () => {
    const link = `${window.location.origin}/#/join?ref=${userId}`;
    navigator.clipboard.writeText(link);
    alert("Referral Link Copied!");
  };

  if (!userData) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-24 shadow-2xl relative border-x border-gray-100 overflow-hidden">
      {/* Header with Balance */}
      <div className="bg-white p-6 flex justify-between items-center sticky top-0 z-50 border-b shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-100">
            <i className="fas fa-vault text-white text-lg"></i>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">Live Assets</p>
            <p className="text-2xl font-black text-gray-800 tracking-tight">৳{userData.balance.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border">
            <i className="fas fa-user-circle text-indigo-600 text-lg"></i>
            <span className="text-[10px] font-black text-gray-600 uppercase">#{userId}</span>
        </div>
      </div>

      <div className="p-6">
        {activePage === UserPages.HOME && (
          <div className="animate-fadeIn">
            <div className="mb-10 text-center">
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">THE HUB<span className="text-indigo-600">.</span></h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-2">Premium Content Gateway</p>
            </div>
            
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.id} className="bg-white p-4 rounded-[2rem] flex gap-5 shadow-sm border border-gray-100 group hover:shadow-xl transition-all">
                  <div className="relative min-w-[120px]">
                    <img src={post.thumb} className="rounded-2xl w-32 h-32 object-cover border bg-gray-50" />
                    <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
                    <span className="absolute top-2 left-2 bg-indigo-600 text-[8px] text-white px-3 py-1 rounded-full font-black uppercase tracking-widest border border-indigo-400 shadow-lg shadow-indigo-200">
                      Locked
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                        <h4 className="font-black text-gray-800 text-base leading-tight group-hover:text-indigo-600 transition-colors">{post.title}</h4>
                        <div className="flex items-center gap-2 mt-2">
                           <span className="bg-gray-100 text-gray-500 text-[8px] font-black px-2 py-0.5 rounded uppercase">{post.zone}</span>
                           <span className="text-[9px] font-black text-indigo-500 uppercase">{post.ads} Required</span>
                        </div>
                    </div>
                    <button onClick={() => handleWatchAd('post', 0)} className="w-full bg-gray-900 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                      Unlock Content
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePage === UserPages.EARN && (
          <div className="animate-fadeIn text-center pt-10">
            <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Cash Accumulator</div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Fast Earnings</h2>
            
            <div className="mt-12 bg-white p-12 rounded-[4rem] shadow-2xl shadow-indigo-100 border border-gray-50 relative overflow-hidden group">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-50 rounded-full blur-3xl group-hover:bg-indigo-100 transition-colors"></div>
              <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-indigo-200 rotate-12 group-hover:rotate-0 transition-transform">
                <i className="fas fa-play text-white text-4xl ml-1"></i>
              </div>
              <h3 className="text-3xl font-black text-gray-800 mb-4">Launch Video</h3>
              <p className="text-gray-400 text-xs mb-10 font-bold uppercase tracking-widest leading-relaxed">Reward: <span className="text-green-600">৳{config.reward.toFixed(2)}</span> per play</p>
              
              <button onClick={() => handleWatchAd('earn')} className="w-full bg-gray-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(0,0,0,0.1)] active:scale-95 transition-all">
                Execute Stream
              </button>
            </div>
            
            <p className="mt-10 text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Daily Threshold: 0 / {config.limit}</p>
          </div>
        )}

        {activePage === UserPages.TASKS && (
          <div className="animate-fadeIn">
            <h2 className="text-3xl font-black text-gray-900 text-center tracking-tighter">DAILY OPS</h2>
            <p className="text-gray-400 text-[10px] text-center font-black uppercase tracking-[0.3em] mt-1 mb-10">Operational Efficiency Tasks</p>
            
            <div className="bg-white p-6 rounded-[2.5rem] mb-10 shadow-sm border border-gray-100">
                <div className="flex justify-between text-[9px] font-black mb-4 uppercase text-gray-400 tracking-widest">
                    <span>Performance Rating</span>
                    <span className="text-indigo-600">0/{tasks.length} Completed</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full w-[15%] rounded-full shadow-lg shadow-indigo-100"></div>
                </div>
            </div>

            <div className="space-y-4">
                {tasks.map(task => (
                    <div key={task.id} className="bg-white p-6 rounded-[2rem] flex items-center justify-between border border-gray-100 shadow-sm hover:border-indigo-200 transition-all group">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <i className="fas fa-layer-group text-xl"></i>
                            </div>
                            <div>
                                <h4 className="font-black text-gray-800 text-sm uppercase tracking-tight">{task.title}</h4>
                                <p className="text-green-600 font-black text-xs mt-1">+৳30.00 Credit</p>
                            </div>
                        </div>
                        <button onClick={() => handleWatchAd('task', 30)} className="bg-gray-900 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-90 transition-all">
                            Start
                        </button>
                    </div>
                ))}
            </div>
          </div>
        )}

        {activePage === UserPages.REFER && (
          <div className="animate-fadeIn">
            <div className="bg-gray-900 p-12 rounded-[4rem] text-white text-center mb-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 group-hover:rotate-0 transition-transform">
                  <i className="fas fa-users text-9xl"></i>
                </div>
                <i className="fas fa-bolt text-indigo-500 text-5xl mb-8"></i>
                <h3 className="text-4xl font-black mb-2 tracking-tighter leading-none">VIRAL LOOP</h3>
                <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.3em]">Exponential Referral Growth</p>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border-2 border-dashed border-gray-100 shadow-sm mb-12 text-center">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Proprietary Referral Key</span>
                <div className="flex items-center gap-3 mt-6 bg-gray-50 p-2.5 rounded-[2rem] border border-gray-100">
                    <input type="text" readOnly value={`${userId}`} className="bg-transparent flex-1 text-xs font-black text-indigo-600 outline-none px-6 text-center" />
                    <button onClick={copyRefLink} className="bg-indigo-600 text-white px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase shadow-xl active:scale-90 transition-all">Copy</button>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 mb-8 uppercase tracking-[0.3em] text-center">Incentive Milestones</h3>
                {milestones.sort((a,b) => a.count - b.count).map((m, idx) => (
                    <div key={idx} className={`p-6 rounded-[2rem] flex justify-between items-center transition-all ${userData.totalRefer >= m.count ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' : 'bg-white border border-gray-100 opacity-60'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${userData.totalRefer >= m.count ? 'bg-white/20' : 'bg-gray-100 text-gray-400'}`}>
                                {userData.totalRefer >= m.count ? <i className="fas fa-check"></i> : m.count}
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">{m.count} Successful Referrals</span>
                        </div>
                        <span className="text-sm font-black">৳{m.bonus.toFixed(2)}</span>
                    </div>
                ))}
            </div>
          </div>
        )}

        {activePage === UserPages.PROFILE && (
          <div className="animate-fadeIn">
            <div className="text-center mb-12">
                <div className="relative inline-block">
                    <div className="w-32 h-32 rounded-[3rem] bg-indigo-50 flex items-center justify-center border-4 border-white shadow-2xl relative z-10 overflow-hidden">
                        <i className="fas fa-user-ninja text-indigo-600 text-5xl"></i>
                    </div>
                    <div className="absolute -inset-4 bg-indigo-100 rounded-[3.5rem] blur-xl opacity-50"></div>
                </div>
                <h3 className="text-3xl font-black text-gray-900 mt-8 tracking-tighter uppercase">Operator #{userId}</h3>
                <p className="text-indigo-600 text-[10px] font-black mt-1 uppercase tracking-[0.3em]">Level: Alpha Participant</p>
            </div>

            <div className="bg-orange-50 border border-orange-100 p-8 rounded-[3rem] mb-12 flex items-start gap-5">
                <div className="bg-orange-100 p-3 rounded-2xl">
                    <i className="fas fa-shield-virus text-orange-600"></i>
                </div>
                <p className="text-[10px] text-orange-900 leading-relaxed font-black uppercase tracking-widest">
                    Verification Lock: {config.minRef} refers required. <br/>Status: <span className="text-orange-600 text-xs">{userData.totalRefer} / {config.minRef}</span>
                </p>
            </div>

            <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100 mb-10">
                <h4 className="font-black text-gray-800 mb-10 border-l-8 border-indigo-600 pl-5 uppercase text-[10px] tracking-[0.3em]">Capital Cashout</h4>
                <form onSubmit={submitWithdraw} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Payment Channel</label>
                        <select className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[2rem] text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500 uppercase">
                            <option>Bkash (Personal)</option>
                            <option>Nagad (Personal)</option>
                            <option>Rocket (Personal)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Account Credentials</label>
                        <input name="number" type="number" required placeholder="01XXXXXXXXX" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[2rem] text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Withdrawal Quantum (৳)</label>
                        <input name="amount" type="number" required placeholder={`Min. ৳${config.minAmt}`} className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[2rem] text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <button type="submit" className="w-full mt-6 bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 active:scale-95">
                        Initiate Transfer
                    </button>
                </form>
            </div>

            <div className="text-center mt-12 mb-4">
              <button onClick={() => navigate('/admin')} className="text-[9px] font-black text-gray-300 uppercase tracking-[0.5em] hover:text-indigo-400 transition-colors">
                System Admin Access
              </button>
            </div>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white p-6 flex justify-around items-center border-t rounded-t-[4rem] shadow-[0_-20px_60px_rgba(0,0,0,0.08)] z-50">
        {[
            { id: UserPages.HOME, icon: 'fa-home', label: 'Hub' },
            { id: UserPages.EARN, icon: 'fa-bolt', label: 'Earn' },
            { id: UserPages.TASKS, icon: 'fa-layer-group', label: 'Ops' },
            { id: UserPages.REFER, icon: 'fa-network-wired', label: 'Loop' },
            { id: UserPages.PROFILE, icon: 'fa-user-ninja', label: 'Me' },
        ].map(btn => (
            <button key={btn.id} onClick={() => setActivePage(btn.id)} className={`flex flex-col items-center gap-1 transition-all duration-300 ${activePage === btn.id ? 'text-indigo-600 scale-110' : 'text-gray-300'}`}>
                <div className={`p-3 rounded-2xl ${activePage === btn.id ? 'bg-indigo-50 shadow-inner' : ''}`}>
                    <i className={`fas ${btn.icon} text-xl`}></i>
                </div>
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${activePage === btn.id ? 'opacity-100' : 'opacity-0'}`}>{btn.label}</span>
            </button>
        ))}
      </nav>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default UserLayout;
