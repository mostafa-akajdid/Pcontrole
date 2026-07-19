import { useState } from 'react';
import { Plus, Search, Mail, Phone, MoreVertical, UserPlus, Edit, Trash2, Eye } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AddMemberModal from '@/components/modals/AddMemberModal';
import ViewMemberModal from '@/components/modals/ViewMemberModal';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { useAppearance } from '@/contexts/AppearanceContext';

const teamMembers = [
  { 
    id: 1, 
    name: 'Sarah Johnson', 
    role: 'Product Manager', 
    email: 'sarah.j@company.com', 
    phone: '+1 234 567 8901',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    status: 'active',
    projects: 8,
    tasks: 24,
    department: 'Product'
  },
  { 
    id: 2, 
    name: 'Mike Chen', 
    role: 'Senior Developer', 
    email: 'mike.c@company.com', 
    phone: '+1 234 567 8902',
    avatar: 'https://i.pravatar.cc/150?u=mike',
    status: 'active',
    projects: 6,
    tasks: 28,
    department: 'Engineering'
  },
  { 
    id: 3, 
    name: 'Emma Wilson', 
    role: 'UX Designer', 
    email: 'emma.w@company.com', 
    phone: '+1 234 567 8903',
    avatar: 'https://i.pravatar.cc/150?u=emma',
    status: 'active',
    projects: 5,
    tasks: 22,
    department: 'Design'
  },
  { 
    id: 4, 
    name: 'John Doe', 
    role: 'Backend Developer', 
    email: 'john.d@company.com', 
    phone: '+1 234 567 8904',
    avatar: 'https://i.pravatar.cc/150?u=john',
    status: 'active',
    projects: 7,
    tasks: 26,
    department: 'Engineering'
  },
  { 
    id: 5, 
    name: 'Alex Brown', 
    role: 'QA Engineer', 
    email: 'alex.b@company.com', 
    phone: '+1 234 567 8905',
    avatar: 'https://i.pravatar.cc/150?u=alex',
    status: 'away',
    projects: 4,
    tasks: 20,
    department: 'Quality'
  },
  { 
    id: 6, 
    name: 'Lisa Anderson', 
    role: 'Marketing Manager', 
    email: 'lisa.a@company.com', 
    phone: '+1 234 567 8906',
    avatar: 'https://i.pravatar.cc/150?u=lisa',
    status: 'active',
    projects: 6,
    tasks: 18,
    department: 'Marketing'
  },
];

const departments = ['All', 'Product', 'Engineering', 'Design', 'Quality', 'Marketing'];

export default function Team() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const { accentColor } = useAppearance();
  const [showAddMember, setShowAddMember] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showViewProfile, setShowViewProfile] = useState(false);
  const [showEditMember, setShowEditMember] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const handleViewProfile = (member) => {
    setSelectedMember(member);
    setShowViewProfile(true);
    setOpenMenuId(null);
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setShowEditMember(true);
    setOpenMenuId(null);
  };

  const handleRemoveMember = (member) => {
    setSelectedMember(member);
    setShowConfirmDelete(true);
    setOpenMenuId(null);
  };

  const confirmRemoveMember = () => {
    setShowConfirmDelete(false);
    setSelectedMember(null);
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All' || member.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <DashboardLayout
      title="Team - Project Management"
      description="Manage your team members and collaboration"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-1">Team</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your team members and collaboration</p>
        </div>
        <button 
          onClick={() => setShowAddMember(true)}
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all shadow-lg"
          style={{ backgroundColor: accentColor }}
        >
          <UserPlus size={16} /> Add Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Members</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{teamMembers.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Now</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{teamMembers.filter(m => m.status === 'active').length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Projects</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{teamMembers.reduce((sum, m) => sum + m.projects, 0)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedDepartment === dept ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                style={selectedDepartment === dept ? { backgroundColor: accentColor } : {}}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <div key={member.id} className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={member.avatar} 
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    member.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{member.name}</h3>
                  <p className="text-sm text-gray-500">{member.role}</p>
                </div>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <MoreVertical size={18} />
                </button>
                
                {/* Dropdown Menu */}
                <div className={`absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-10 transition-all duration-200 origin-top-right ${
                  openMenuId === member.id 
                    ? 'opacity-100 scale-100 visible' 
                    : 'opacity-0 scale-95 invisible'
                }`}>
                  <button 
                    onClick={() => handleViewProfile(member)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <Eye size={16} className="text-gray-400 dark:text-gray-500" />
                    View Profile
                  </button>
                  <button 
                    onClick={() => handleEditMember(member)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <Edit size={16} className="text-gray-400 dark:text-gray-500" />
                    Edit Member
                  </button>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                  <button 
                    onClick={() => handleRemoveMember(member)}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={16} />
                    Remove Member
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={16} className="text-gray-400" />
                <span>{member.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={16} className="text-gray-400" />
                <span>{member.phone}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800">{member.projects}</p>
                <p className="text-xs text-gray-500">Projects</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800">{member.tasks}</p>
                <p className="text-xs text-gray-500">Tasks</p>
              </div>
              <div className="text-center">
                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {member.department}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      <AddMemberModal 
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        onSubmit={(memberData) => {
          setShowAddMember(false);
        }}
      />

      {/* Edit Member Modal */}
      <AddMemberModal 
        isOpen={showEditMember}
        onClose={() => setShowEditMember(false)}
        onSubmit={(memberData) => {
          setShowEditMember(false);
        }}
        initialData={selectedMember}
        isEdit={true}
      />

      {/* View Profile Modal */}
      <ViewMemberModal 
        isOpen={showViewProfile}
        onClose={() => setShowViewProfile(false)}
        member={selectedMember}
        onEdit={handleEditMember}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog 
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={confirmRemoveMember}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${selectedMember?.name}? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
      />

      {/* Overlay to close menu */}
      {openMenuId && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setOpenMenuId(null)}
        ></div>
      )}
    </DashboardLayout>
  );
}
