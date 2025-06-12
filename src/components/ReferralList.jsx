import { useEffect, useState } from 'react';
import { getMine } from '../services/referrals';

const ReferralList = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMine()
      .then(res => setRows(res.data.referrals))
      .catch(err => console.error('Failed to fetch referrals', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading referrals...</p>;
  if (!rows.length) return <p>No referrals yet.</p>;

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">People you referred</h3>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Email</th>
            <th className="py-2">Joined</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-b hover:bg-gray-50">
              <td className="py-2">{r.referred_email}</td>
              <td className="py-2">{new Date(r.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReferralList;
