import { useEffect, useState } from 'react';
import { getAll } from '../services/referrals';

const AdminReferrals = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAll()
      .then(res => setRows(res.data.referrals))
      .catch(err => console.error('Failed to fetch referrals', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-4">Loading referrals...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">All Referrals</h1>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Referrer</th>
            <th className="py-2">Referred</th>
            <th className="py-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-b hover:bg-gray-50">
              <td className="py-2">{r.referrer_email}</td>
              <td className="py-2">{r.referred_email}</td>
              <td className="py-2">{new Date(r.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminReferrals;
