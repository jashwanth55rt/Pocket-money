import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink } from 'lucide-react';

export default function Tasks() {
  const { userProfile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [proof, setProof] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const q = query(collection(db, "tasks"), where("active", "==", true));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTasks(fetched);
      } catch (error) {
        console.error("Error fetching tasks", error);
      }
      setLoading(false);
    };
    fetchTasks();
  }, []);

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !selectedTask) return;
    if (!proof.trim()) {
      toast.error("Please enter proof");
      return;
    }

    try {
      await addDoc(collection(db, "taskSubmissions"), {
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        taskReward: selectedTask.reward || 0,
        userId: userProfile.id,
        userName: userProfile.name,
        proof,
        status: "pending",
        createdAt: serverTimestamp()
      });
      toast.success("Proof submitted. Waiting for admin approval.");
      setSelectedTask(null);
      setProof('');
    } catch (error) {
      toast.error("Failed to submit proof");
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-400">Loading...</div>;

  const catColors: any = {Instagram: '#EC4899', YouTube: '#EF4444', Telegram: '#3B82F6', Website: '#06B6D4', 'App Install': '#A855F7', Custom: '#F59E0B'};
  const catIcons: any = {Instagram: 'Instagram', YouTube: 'YouTube', Telegram: 'Telegram', Website: 'Web', 'App Install': 'App', Custom: 'Star'};

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-1">
         <h2 className="text-[20px] font-extrabold text-gray-900">Available Tasks</h2>
      </div>
      
      {tasks.length === 0 ? (
        <div className="text-center bg-white border border-gray-100 shadow-sm rounded-[24px] p-10 text-gray-400">
          No tasks available at the moment.
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const col = catColors[task.category] || '#F59E0B';
            const done = userProfile?.completedTasks?.includes(task.id);
            return (
              <motion.div 
                whileTap={!done ? { scale: 0.98 } : {}}
                key={task.id} 
                onClick={() => !done && setSelectedTask(task)}
                className={`bg-white border border-gray-100 shadow-sm rounded-[20px] p-4 flex items-center justify-between gap-3 ${done ? 'opacity-60 cursor-default' : 'cursor-pointer hover:shadow-md transition-shadow'}`}
              >
                <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: `${col}15`, color: col }}>
                   {catIcons[task.category] ? catIcons[task.category][0] : '★'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[14px] text-gray-900 truncate leading-tight mb-1">{task.title}</h3>
                  <div className="text-[#30D158] font-bold text-[13px]">🪙 {task.reward || 0} coins</div>
                </div>
                {done ? (
                  <span className="bg-[#30D158]/10 text-[#30D158] px-3 py-1.5 rounded-full text-xs font-bold shrink-0">Done ✓</span>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                     <span className="text-lg leading-none">›</span>
                  </div>
                )}
              </motion.div>
             )
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40"
              onClick={() => setSelectedTask(null)}
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-50 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2" />
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-extrabold text-gray-900 leading-tight">{selectedTask.title}</h3>
                  <button onClick={() => setSelectedTask(null)} className="w-8 h-8 rounded-full bg-gray-100 border-none flex items-center justify-center text-gray-500 shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="text-[#F59E0B] font-bold text-[15px] mb-4">🪙 {selectedTask.reward || 0} coins reward</div>
                
                <p className="text-[14px] text-gray-600 leading-relaxed mb-6">{selectedTask.description}</p>
                
                {selectedTask.link && (
                   <a 
                     href={selectedTask.link} 
                     target="_blank" 
                     rel="noreferrer"
                     className="flex items-center justify-center w-full bg-[#30D158] hover:bg-[#25A244] text-white font-bold py-4 rounded-[20px] mb-6 shadow-[0_4px_16px_rgba(48,209,88,0.3)] transition-all active:scale-[0.98]"
                   >
                     <ExternalLink className="w-5 h-5 mr-2" />
                     Go to Task
                   </a>
                )}

                <form onSubmit={handleSubmitProof} className="space-y-4">
                  <label className="block text-[13px] font-bold text-gray-500 mb-2">Submit Proof</label>
                  <textarea 
                    className="w-full bg-[#F7F7FA] border border-gray-200 rounded-[16px] p-4 focus:outline-none focus:border-[#30D158] text-[14px] text-gray-900 placeholder:text-gray-400 min-h-[100px] resize-y"
                    placeholder="Paste screenshot link or describe what you did..."
                    value={proof}
                    onChange={(e) => setProof(e.target.value)}
                  />
                  <button 
                    type="submit"
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-[20px] transition-all active:scale-[0.98]"
                  >
                    ✅ Submit for Review
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
