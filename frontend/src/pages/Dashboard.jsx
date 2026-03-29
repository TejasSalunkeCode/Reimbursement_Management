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
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className={`p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all animate-slideUp`}>
    <div className="flex items-start justify-between">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4`}>
        <Icon size={24} className="text-white" />
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/expenses/my');
        const expenses = res.data.data;
        
        setRecentExpenses(expenses.slice(0, 5));
        
        const summary = expenses.reduce((acc, exp) => {
          acc[exp.status.toLowerCase()]++;
          if (exp.status === 'Approved') {
            acc.totalAmount += parseFloat(exp.convertedAmount || exp.amount);
          }
          return acc;
        }, { pending: 0, approved: 0, rejected: 0, totalAmount: 0 });
        
        setStats(summary);

        // Process chart data (Approvals by Category)
        const categoryMap = expenses.reduce((acc, exp) => {
          acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.convertedAmount || exp.amount);
          return acc;
        }, {});

        setChartData(Object.keys(categoryMap).map(name => ({
          name,
          value: parseFloat(categoryMap[name].toFixed(2))
        })));

      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="animate-pulse space-y-8">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-3xl"></div>)}
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Hello, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your expenses.</p>
        </div>
        <Link 
          to="/expenses/new" 
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-xl shadow-primary-100 transition-all hover:-translate-y-0.5"
        >
          <Plus size={20} />
          <span>New Expense</span>
        </Link>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Wallet} 
          label="Total Reimbursed" 
          value={`${user?.company?.currency || 'INR'} ${stats.totalAmount.toLocaleString()}`}
          color="bg-primary-600"
        />
        <StatCard 
          icon={Clock} 
          label="Pending Approval" 
          value={stats.pending}
          color="bg-orange-500"
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Approved" 
          value={stats.approved}
          color="bg-green-500"
        />
        <StatCard 
          icon={XCircle} 
          label="Rejected" 
          value={stats.rejected}
          color="bg-red-500"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Expenses List */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <Link to="/expenses/history" className="text-sm font-bold text-primary-600 hover:underline">View all</Link>
          </div>
          
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {recentExpenses.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {recentExpenses.map((exp) => (
                  <div key={exp.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                        exp.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        exp.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {exp.status.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{exp.category}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(exp.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="font-bold text-gray-900">{exp.currency} {exp.amount}</p>
                        <p className="text-xs text-gray-400 capitalize">{exp.status}</p>
                      </div>
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="text-gray-300" size={32} />
                </div>
                <p className="text-gray-500 font-medium">No expenses found.</p>
                <Link to="/expenses/new" className="text-primary-600 font-bold mt-2 inline-block">Submit your first claim</Link>
              </div>
            )}
          </div>
        </section>

        {/* Chart Column */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Expense Distribution</h2>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="h-64 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart suppressHydrationWarning>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(val) => `${user?.company?.currency || 'INR'} ${val}`}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-300 italic text-sm">
                  Not enough data for insights
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50">
              <div className="flex items-center gap-2 text-indigo-600">
                <BarChart3 size={16} />
                <span className="text-xs font-bold uppercase tracking-wider underline decoration-indigo-200 underline-offset-4 cursor-pointer">Detailed breakdown</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-600 to-primary-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100">
            <h3 className="font-bold text-lg mb-2">OCR is active! 🚀</h3>
            <p className="text-indigo-100 text-sm leading-relaxed mb-6">
              Just upload a photo of your receipt and let AI do the work.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;

