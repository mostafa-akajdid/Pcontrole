import { useState } from 'react';
import { Search, Book, MessageCircle, Mail, Phone, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAppearance } from '@/contexts/AppearanceContext';

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      { q: 'How do I create a new project?', a: 'Click the "Add Project" button on the dashboard and fill in the project details.' },
      { q: 'How do I invite team members?', a: 'Go to Team page and click "Add Member" button to send invitations via email.' },
      { q: 'Can I import existing projects?', a: 'Yes, use the "Import Data" button on the dashboard to upload your project data.' },
    ]
  },
  {
    category: 'Tasks & Projects',
    questions: [
      { q: 'How do I assign tasks to team members?', a: 'Open a task and select a team member from the assignee dropdown.' },
      { q: 'Can I set task priorities?', a: 'Yes, you can set priorities as Low, Medium, High, or Critical when creating or editing tasks.' },
      { q: 'How do I track project progress?', a: 'Use the Analytics page to view detailed progress reports and charts.' },
    ]
  },
  {
    category: 'Account & Billing',
    questions: [
      { q: 'How do I upgrade my plan?', a: 'Go to Settings > Billing and select the plan that fits your needs.' },
      { q: 'Can I cancel my subscription?', a: 'Yes, you can cancel anytime from Settings > Billing. Your access continues until the end of the billing period.' },
      { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and bank transfers for enterprise plans.' },
    ]
  },
];

const resources = [
  { title: 'Documentation', description: 'Complete guides and API references', icon: Book, link: '#' },
  { title: 'Video Tutorials', description: 'Step-by-step video guides', icon: Book, link: '#' },
  { title: 'Community Forum', description: 'Connect with other users', icon: MessageCircle, link: '#' },
  { title: 'API Reference', description: 'Developer documentation', icon: Book, link: '#' },
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const { accentColor } = useAppearance();

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(item =>
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <DashboardLayout
      title="Help Center - Project Management"
      description="Get help and support for your questions"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-1">Help Center</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Find answers and get support</p>
      </div>

      {/* Search */}
      <div 
        className="rounded-2xl p-8 mb-8 text-white"
        style={{ 
          background: `linear-gradient(135deg, ${accentColor}dd 0%, ${accentColor} 50%, ${accentColor}cc 100%)`
        }}
      >
        <h2 className="text-2xl font-bold mb-4">How can we help you?</h2>
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
      </div>

      {/* Quick Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {resources.map((resource) => {
          const Icon = resource.icon;
          return (
            <a
              key={resource.title}
              href={resource.link}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all group"
              onMouseEnter={(e) => {
                const iconBox = e.currentTarget.querySelector('.icon-box');
                const icon = e.currentTarget.querySelector('.icon-svg');
                if (iconBox) iconBox.style.backgroundColor = accentColor;
                if (icon) icon.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                const iconBox = e.currentTarget.querySelector('.icon-box');
                const icon = e.currentTarget.querySelector('.icon-svg');
                if (iconBox) iconBox.style.backgroundColor = `${accentColor}20`;
                if (icon) icon.style.color = accentColor;
              }}
            >
              <div 
                className="icon-box w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all"
                style={{ 
                  backgroundColor: `${accentColor}20`
                }}
              >
                <Icon className="icon-svg transition-colors" style={{ color: accentColor }} size={24} />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{resource.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{resource.description}</p>
            </a>
          );
        })}
      </div>

      {/* FAQs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 mb-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          {filteredFaqs.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{category.category}</h3>
              <div className="space-y-3">
                {category.questions.map((item, index) => {
                  const faqId = `${categoryIndex}-${index}`;
                  const isExpanded = expandedFaq === faqId;
                  
                  return (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(isExpanded ? null : faqId)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="font-medium text-gray-800 dark:text-gray-200">{item.q}</span>
                        <ChevronRight 
                          className={`text-gray-400 dark:text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                          size={20} 
                        />
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 text-gray-600 dark:text-gray-400 text-sm border-t border-gray-100 dark:border-gray-700 pt-4">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Still need help?</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Our support team is here to help you</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="mailto:support@piolec.com" 
            className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg transition-all group"
            style={{ 
              '--hover-border-color': accentColor 
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = accentColor}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
          >
            <div 
              className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center transition-all"
              style={{ 
                '--hover-bg-color': accentColor 
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentColor}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
            >
              <Mail className="text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" size={24} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">Email Us</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">support@piolec.com</p>
            </div>
          </a>

          <a 
            href="tel:+1234567890" 
            className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg transition-all group"
            onMouseEnter={(e) => e.currentTarget.style.borderColor = accentColor}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
          >
            <div 
              className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center transition-all"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentColor}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
            >
              <Phone className="text-green-600 dark:text-green-400 group-hover:text-white transition-colors" size={24} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">Call Us</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">+21276254011</p>
            </div>
          </a>

          <a 
            href="#" 
            className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg transition-all group"
            onMouseEnter={(e) => e.currentTarget.style.borderColor = accentColor}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
          >
            <div 
              className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center transition-all"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentColor}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
            >
              <MessageCircle className="text-purple-600 dark:text-purple-400 group-hover:text-white transition-colors" size={24} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">Live Chat</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Available 24/7</p>
            </div>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}
