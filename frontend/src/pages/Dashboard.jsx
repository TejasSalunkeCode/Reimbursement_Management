import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  ChevronRight,
  Wallet,
  Calendar,
  BarChart3,
  Filter,
  RefreshCw,
  Search,
  ArrowRight
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title,
  PointElement,
  LineElement
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title,
  PointElement,
  LineElement
);

const StatCard = ({ icon: Icon, label, value, subValue, color }) => (
  <div className={`p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all animate-slideUp group overflow-hidden relative`}>
    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gray-50 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
    <div className="flex items-start justify-between relative z-10">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4 shadow-lg shadow-current/10`}>
        <Icon size={24} className="text-white" />
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
        {subValue && <p className="text-xs font-bold text-primary-500 mt-1">{subValue}</p>}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateFilter, setDateFilter] = useState('all'); // all, month, week
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses/my');
      setExpenses(res.data.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesCategory = categoryFilter === 'All' || exp.category === categoryFilter;
      
      const expDate = new Date(exp.date);
      const now = new Date();
      let matchesDate = true;
      
      if (dateFilter === 'month') {
        matchesDate = expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      } else if (dateFilter === 'week') {
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = expDate >= lastWeek;
      }
      
      return matchesCategory && matchesDate;
    });
  }, [expenses, categoryFilter, dateFilter]);

  const stats = useMemo(() => {
    return filteredExpenses.reduce((acc, exp) => {
      acc[exp.status.toLowerCase()]++;
      acc.totalCount++;
      const val = parseFloat(exp.convertedAmount || exp.amount);
      acc.totalValue += val;
      if (exp.status === 'Approved') acc.approvedValue += val;
      return acc;
    }, { 
      pending: 0, 
      approved: 0, 
      rejected: 0, 
      totalCount: 0,
      totalValue: 0,
      approvedValue: 0 
    });
  }, [filteredExpenses]);

  const pieData = {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [{
      data: [stats.approved, stats.pending, stats.rejected],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0,
      hoverOffset: 10
    }]
  };

  const barData = useMemo(() => {
    const cats = [...new Set(expenses.map(e => e.category))];
    const data = cats.map(cat => {
      return filteredExpenses
        .filter(e => e.category === cat)
        .reduce((sum, e) => sum + parseFloat(e.convertedAmount || e.amount), 0);
    });
    return {
      labels: cats,
      datasets: [{
        label: `Spending (${user?.company?.currency || 'INR'})`,
        data,
        backgroundColor: 'rgba(14, 165, 233, 0.8)',
        borderRadius: 12,
        maxBarThickness: 40
      }]
    };
  }, [filteredExpenses, expenses, user]);

  if (loading) return (
    <div className="animate-pulse space-y-8">
      <div className="h-8 bg-gray-200 rounded-xl w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-40 bg-gray-50 rounded-[32px]"></div>)}
      </div>
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 h-96 bg-gray-50 rounded-[40px]"></div>
        <div className="h-96 bg-gray-50 rounded-[40px]"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-2 underline decoration-primary-300 decoration-8 underline-offset-4">
            Intelligence.
          </h1>
          <p className="text-gray-400 font-bold ml-1 uppercase tracking-widest text-xs">Real-time workspace analytics</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
            {[
              { id: 'all', label: 'All' },
              { id: 'month', label: 'Month' },
              { id: 'week', label: 'Week' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  dateFilter === f.id ? 'bg-slate-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Link 
            to="/expenses/new" 
            className="inline-flex items-center gap-3 px-6 py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-200 transition-all hover:-translate-y-1 active:scale-95 uppercase text-xs tracking-widest"
          >
            <Plus size={18} />
            <span>New Claim</span>
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Wallet} 
          label="Gross Spending" 
          value={`${user?.company?.currency || 'INR'} ${stats.totalValue.toLocaleString()}`}
          subValue={`Avg: ${stats.totalCount > 0 ? (stats.totalValue / stats.totalCount).toFixed(0) : 0} per claim`}
          color="bg-slate-900"
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Approved Claims" 
          value={stats.approved}
          subValue={`${user?.company?.currency || 'INR'} ${stats.approvedValue.toLocaleString()}`}
          color="bg-emerald-500"
        />
        <StatCard 
          icon={Clock} 
          label="Awaiting Audit" 
          value={stats.pending}
          subValue="2.4 days avg turnaround"
          color="bg-amber-500"
        />
        <StatCard 
          icon={TrendingUp} 
          label="Efficiency" 
          value={`${stats.totalCount > 0 ? Math.round((stats.approved / stats.totalCount) * 100) : 0}%`}
          subValue="Overall approval rate"
          color="bg-indigo-600"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Chart */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Financial Trends</h2>
            <div className="flex items-center gap-3">
               <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none shadow-sm cursor-pointer hover:border-primary-300 transition-all"
              >
                <option>All</option>
                <option>Travel</option>
                <option>Food</option>
                <option>Office</option>
                <option>Software</option>
              </select>
              <button 
                onClick={fetchData}
                className="p-2.5 bg-white border border-gray-100 text-gray-400 hover:text-primary-600 rounded-xl transition-all shadow-sm"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          
          <div className="bg-white p-10 rounded-[40px] border border-gray-50 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8">
               <BarChart3 className="text-gray-50 group-hover:text-primary-50 transition-colors duration-500" size={120} />
             </div>
             <div className="relative z-10 h-80">
                <Bar 
                  data={barData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, grid: { display: false }, ticks: { font: { weight: 'bold' } } },
                      x: { grid: { display: false }, ticks: { font: { weight: 'bold' } } }
                    }
                  }} 
                />
             </div>
          </div>
        </section>

        {/* Status Breakdown */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight px-2">Audit Status</h2>
          <div className="bg-white p-10 rounded-[40px] border border-gray-50 shadow-sm flex flex-col items-center justify-center">
             <div className="w-full aspect-square relative mb-8">
                <Pie 
                  data={pieData} 
                  options={{ 
                    plugins: { 
                      legend: { position: 'bottom', labels: { usePointStyle: true, font: { weight: 'bold', size: 11 } } } 
                    } 
                  }} 
                />
             </div>
             
             <div className="w-full space-y-4 pt-6 border-t border-gray-50">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-gray-100">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Approved</span>
                   </div>
                   <span className="font-black text-gray-900">{stats.approved}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-gray-100">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pending</span>
                   </div>
                   <span className="font-black text-gray-900">{stats.pending}</span>
                </div>
             </div>
          </div>
        </section>
      </div>

      <div className="flex items-center justify-center pt-10">
         <div className="bg-slate-900 p-8 rounded-[32px] w-full max-w-2xl text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="text-center md:text-left">
                  <h3 className="text-2xl font-black mb-2 italic">Automated Reconciliation.</h3>
                  <p className="text-slate-400 text-sm font-medium">RMS Core detected 3 optimization opportunities in your last audit cycle.</p>
               </div>
               <button className="whitespace-nowrap px-8 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-primary-50 transition-all flex items-center gap-3 shadow-xl">
                  <span>View Report</span>
                  <ArrowRight size={20} />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
