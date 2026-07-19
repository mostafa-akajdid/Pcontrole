import { formatDistanceToNow } from 'date-fns';
import { HardDrive, Image, FileText, Film, Music, File } from 'lucide-react';
import { useAppearance } from '@/contexts/AppearanceContext';

const FORMAT_ICONS = {
  jpg: Image,
  jpeg: Image,
  png: Image,
  gif: Image,
  webp: Image,
  svg: Image,
  mp4: Film,
  webm: Film,
  mp3: Music,
  wav: Music,
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  default: File,
};

const FORMAT_COLORS = {
  jpg: 'bg-blue-100 text-blue-600',
  jpeg: 'bg-blue-100 text-blue-600',
  png: 'bg-green-100 text-green-600',
  gif: 'bg-purple-100 text-purple-600',
  webp: 'bg-teal-100 text-teal-600',
  svg: 'bg-orange-100 text-orange-600',
  mp4: 'bg-red-100 text-red-600',
  webm: 'bg-red-100 text-red-600',
  mp3: 'bg-pink-100 text-pink-600',
  wav: 'bg-pink-100 text-pink-600',
  pdf: 'bg-amber-100 text-amber-600',
  doc: 'bg-indigo-100 text-indigo-600',
  docx: 'bg-indigo-100 text-indigo-600',
};

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function TimeTracker({ data }) {
  const { accentColor } = useAppearance();
  const storage = data?.storageBreakdown;
  const recentMedia = data?.recentMedia || [];

  const totalSize = formatBytes(storage?.totalSizeBytes);

  return (
    <div 
      className="h-[350px] rounded-3xl p-6 relative overflow-hidden text-white flex flex-col"
      style={{ backgroundColor: accentColor }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl -mr-10 -mt-10 pointer-events-none" style={{ backgroundColor: accentColor }}></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl -ml-10 -mb-10 pointer-events-none" style={{ backgroundColor: accentColor }}></div>
      
      <svg 
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0,100 Q150,200 300,100 T600,100" fill="none" stroke="white" strokeWidth="2" />
        <path d="M0,120 Q150,220 300,120 T600,120" fill="none" stroke="white" strokeWidth="2" opacity="0.7" />
        <path d="M0,140 Q150,240 300,140 T600,140" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
      </svg>
      
      <div className="relative z-20 flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-lg">Storage Overview</h3>
          <p className="text-sm text-white/70">{totalSize} used · {storage?.totalFiles || 0} files</p>
        </div>
        <HardDrive size={20} className="text-white/70" />
      </div>
      
      <div className="relative z-10 flex-1">
        {storage?.byFormat?.length > 0 ? (
          <div className="space-y-3">
            {storage.byFormat.slice(0, 5).map((fmt) => {
              const Icon = FORMAT_ICONS[fmt.format] || FORMAT_ICONS.default;
              const colorClass = FORMAT_COLORS[fmt.format] || 'bg-gray-100 text-gray-600';
              const percentage = storage.totalSizeBytes > 0 
                ? Math.round((fmt.sizeBytes / storage.totalSizeBytes) * 100) 
                : 0;
              
              return (
                <div key={fmt.format} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Icon size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium uppercase">{fmt.format}</span>
                      <span className="text-white/70">{fmt.count} files · {formatBytes(fmt.sizeBytes)}</span>
                    </div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white/70 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-white/50 text-sm">
            No media files uploaded yet
          </div>
        )}
      </div>
    </div>
  );
}
