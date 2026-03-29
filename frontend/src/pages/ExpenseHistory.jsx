import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Download,
  FileText
} from 'lucide-react';
import api from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ExpenseHistory = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await api.get('/expenses/my');
        setExpenses(res.data.data);
      } catch (err) {
        console.error('Failed to fetch expenses', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(14, 165, 233); // primary-600
    doc.text('Expense Reimbursement Report', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    // Table
    const tableData = filteredExpenses.map(exp => [
      new Date(exp.date).toLocaleDateString(),
      exp.category,
      exp.description || 'N/A',
      exp.status.toUpperCase(),
      `${exp.currency} ${exp.amount}`,
      exp.convertedAmount ? `INR ${exp.convertedAmount}` : 'N/A'
    ]);

    doc.autoTable({
      startY: 40,
      head: [['Date', 'Category', 'Description', 'Status', 'Amount', 'Converted (INR)']],
      body: tableData,
      headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      styles: { fontSize: 8, cellPadding: 4 },
      columnStyles: {
        3: { fontStyle: 'bold' } // Status
      }
    });

    doc.save(`Expenses_${new Date().getTime()}.pdf`);
  };

  const filteredExpenses = filter === 'All' 
    ? expenses 
    : expenses.filter(e => e.status === filter);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
      {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl w-full"></div>)}
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense History</h1>
          <p className="text-gray-500 mt-1">Track and manage your submitted claims.</p>
        </div>
        <button 
          onClick={exportToPDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-600 font-bold border border-primary-100 shadow-sm hover:shadow-md rounded-xl transition-all hover:-translate-y-0.5"
        >
          <FileText size={18} />
          <span>Export PDF</span>
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {/* Table Controls */}
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by merchant or category..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <div className="flex bg-white p-1 rounded-xl border border-gray-200">
              {['All', 'Pending', 'Approved', 'Rejected'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === opt 
                      ? 'bg-primary-600 text-white shadow-md' 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-widest bg-slate-50/50">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Category / Merchant</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-primary-50/30 transition-colors group">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <p className="font-semibold text-gray-900">{new Date(exp.date).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400">{new Date(exp.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs uppercase">
                        {exp.category.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{exp.category}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{exp.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(exp.status)} shadow-sm`}>
                      {exp.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right whitespace-nowrap">
                    <p className="font-black text-gray-900 text-lg">{exp.currency} {exp.amount}</p>
                    {exp.convertedAmount && exp.currency !== 'INR' && (
                      <p className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full inline-block">
                        ≈ ₹{exp.convertedAmount}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-gray-400 hover:bg-white hover:text-primary-600 rounded-lg transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-gray-100 shadow-sm">
                      <ExternalLink size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredExpenses.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 scale-110">
              <Search className="text-gray-200" size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Workspace clear.</h3>
            <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
              We couldn't find any expenses matching "{filter === 'All' ? 'your account' : filter}".
            </p>
          </div>
        )}

        {/* Pagination placeholder */}
        <div className="p-6 border-t border-gray-50 flex items-center justify-between text-sm text-gray-500 bg-gray-50/20">
          <p>Showing <b>{filteredExpenses.length}</b> of <b>{expenses.length}</b> records</p>
          <div className="flex items-center gap-2">
            <button disabled className="p-2 hover:bg-white rounded-lg border border-gray-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
            <span className="px-4 font-bold text-gray-900">1</span>
            <button disabled className="p-2 hover:bg-white rounded-lg border border-gray-100 disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseHistory;
