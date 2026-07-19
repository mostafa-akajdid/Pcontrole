import Link from 'next/link';
import { Users } from 'lucide-react';
import { STATUS_COLORS } from '@/lib/utils';

export default function TeamCollaboration({ data, loading }) {
  const teamMembers = data?.recentUsers || [];

  return (
    <div className="h-[350px] flex flex-col bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h3 className="font-bold text-lg text-gray-800">Team Members</h3>
        <Link href="/dashboard/users" className="text-xs border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors">
          View All
        </Link>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">Loading team members...</div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-8">
            <Users size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">No team members yet</p>
          </div>
        ) : (
          teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {member.avatar ? (
                  <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-10 h-10 rounded-full object-cover" 
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-400">{member.name?.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h5 className="font-semibold text-sm text-gray-800">{member.name}</h5>
                  <p className="text-[11px] text-gray-400 truncate max-w-[150px]">
                    {member.role?.name || 'No Role'}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${STATUS_COLORS[member.status] || STATUS_COLORS.ACTIVE}`}>
                {member.status === 'ACTIVE' ? 'Active' : member.status === 'SUSPENDED' ? 'Suspended' : 'Inactive'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
