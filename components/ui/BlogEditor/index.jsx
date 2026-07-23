import { useRef, useCallback, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import dynamic from 'next/dynamic';
import { useEditor, EditorContent } from '@tiptap/react';
import { useAppearance } from '@/contexts/AppearanceContext';
import { useToast } from '@/contexts/ToastContext';
import { getExtensions } from './extensions';
import Toolbar from './Toolbar';
import {
  Maximize2, Minimize2, Image as ImageIcon, Type, Hash, Clock,
  Heading1, Heading2, Heading3, List, ListOrdered,
  CheckSquare, Quote, Code2, Minus, Table as TableIcon,
  Pilcrow,
} from 'lucide-react';


const slashItems = [
  { label: 'Paragraph', icon: Type, command: (editor) => editor.chain().focus().setParagraph().run() },
  { label: 'Heading 1', icon: Heading1, command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run() },
  { label: 'Heading 2', icon: Heading2, command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: 'Heading 3', icon: Heading3, command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: 'Bullet List', icon: List, command: (editor) => editor.chain().focus().toggleBulletList().run() },
  { label: 'Numbered List', icon: ListOrdered, command: (editor) => editor.chain().focus().toggleOrderedList().run() },
  { label: 'Task List', icon: CheckSquare, command: (editor) => editor.chain().focus().toggleTaskList().run() },
  { label: 'Blockquote', icon: Quote, command: (editor) => editor.chain().focus().toggleBlockquote().run() },
  { label: 'Code Block', icon: Code2, command: (editor) => editor.chain().focus().toggleCodeBlock().run() },
  { label: 'Horizontal Rule', icon: Minus, command: (editor) => editor.chain().focus().setHorizontalRule().run() },
  { label: 'Table', icon: TableIcon, command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
];

function SlashMenu({ editor, query, onClose }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  const filtered = slashItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => { setSelectedIndex(0); }, [query]);
  useEffect(() => { menuRef.current?.scrollIntoView({ block: 'nearest' }); }, [selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => (i + 1) % filtered.length); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length); }
      else if (e.key === 'Enter') { e.preventDefault(); if (filtered[selectedIndex]) { filtered[selectedIndex].command(editor); onClose(); } }
      else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIndex, editor, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div ref={menuRef} className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 w-[240px] max-h-[280px] overflow-y-auto">
      <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Blocks</p>
      {filtered.map((item, i) => (
        <button
          key={item.label}
          type="button"
          onClick={() => { item.command(editor); onClose(); }}
          onMouseEnter={() => setSelectedIndex(i)}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors ${
            i === selectedIndex
              ? 'bg-[#224b82]/10 text-[#224b82] dark:bg-[#224b82]/20 dark:text-[#6da3e8]'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <item.icon size={16} className="flex-shrink-0 opacity-70" />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function StatsBar({ editor }) {
  if (!editor) return null;
  const text = editor.storage.characterCount?.characters?.() ?? editor.getText().length;
  const words = editor.storage.characterCount?.words?.() ?? editor.getText().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 text-[11px] text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg select-none">
      <span className="flex items-center gap-1"><Type size={11} />{text.toLocaleString()} chars</span>
      <span className="flex items-center gap-1"><Pilcrow size={11} />{words.toLocaleString()} words</span>
      <span className="flex items-center gap-1"><Clock size={11} />{readingTime} min read</span>
    </div>
  );
}

const BlogEditor = forwardRef(function BlogEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  onOpenMediaLibrary,
  minHeight = 500,
}, ref) {
  const { theme, accentColor } = useAppearance();
  const toast = useToast();
  const editorContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [slashQuery, setSlashQuery] = useState(null);
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });
  const isDark = theme === 'dark' || (theme === 'auto' && typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const handleImageUpload = useCallback(async (file) => {
    try {
      const dataUri = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: dataUri, altText: file.name, folder: 'blog' }),
      });
      const json = await res.json();
      if (json.success) {
        return json.data.url || json.data.secureUrl;
      }
      throw new Error(json.message || 'Upload failed');
    } catch (err) {
      toast.error(`Failed to upload ${file.name}`);
      throw err;
    }
  }, [toast]);

  const editor = useEditor({
    extensions: getExtensions({ placeholder }),
    content: value || '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content focus:outline-none',
        style: `min-height: ${minHeight}px`,
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        event.preventDefault();
        Array.from(files).forEach((file) => {
          if (file.type.startsWith('image/')) {
            handleImageUpload(file).then((url) => {
              const { state } = view;
              const { from } = state.selection;
              const node = state.schema.nodes.image.create({ src: url, alt: file.name });
              view.dispatch(state.tr.insert(from, node));
            }).catch(() => {});
          }
        });
        return true;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            handleImageUpload(file).then((url) => {
              const { state } = view;
              const { from } = state.selection;
              const node = state.schema.nodes.image.create({ src: url, alt: 'Pasted image' });
              view.dispatch(state.tr.insert(from, node));
            }).catch(() => {});
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      onChange?.(html === '<p></p>' ? '' : html);
    },
    onSelectionUpdate: ({ editor: e }) => {
      const { from } = e.state.selection;
      const textBefore = e.state.doc.textBetween(Math.max(0, from - 1), from, '\n');
      if (textBefore === '/') {
        const coords = e.view.coordsAtPos(from);
        const containerRect = editorContainerRef.current?.getBoundingClientRect();
        if (containerRect) {
          setSlashPos({
            top: coords.bottom - containerRect.top + 4,
            left: coords.left - containerRect.left,
          });
        }
        setSlashQuery('');
      } else if (slashQuery !== null) {
        const wordBefore = e.state.doc.textBetween(Math.max(0, from - 20), from, '\n');
        const slashIndex = wordBefore.lastIndexOf('/');
        if (slashIndex >= 0 && wordBefore.slice(slashIndex).match(/^\/\w*$/)) {
          setSlashQuery(wordBefore.slice(slashIndex + 1));
        } else {
          setSlashQuery(null);
        }
      }
    },
  }, []);

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value]);

  useImperativeHandle(ref, () => ({
    insertContent: (html) => {
      if (editor) {
        editor.chain().focus().insertContent(html).run();
      }
    },
    getContent: () => editor?.getHTML() || '',
    focus: () => editor?.commands.focus(),
  }));

  const closeSlashMenu = useCallback(() => setSlashQuery(null), []);

  return (
    <div className={`blog-editor-container ${isFullscreen ? 'blog-editor-fullscreen' : ''}`}>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-2 py-1">
          <Toolbar editor={editor} onOpenMediaLibrary={onOpenMediaLibrary} />
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 transition-colors ml-1"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>

        <div ref={editorContainerRef} className="relative overflow-y-auto" style={{ maxHeight: isFullscreen ? 'calc(100vh - 140px)' : '70vh' }}>
          <EditorContent editor={editor} />
          {slashQuery !== null && editor && (
            <div className="absolute" style={{ top: slashPos.top, left: Math.min(slashPos.left, (editorContainerRef.current?.clientWidth || 500) - 260) }}>
              <SlashMenu editor={editor} query={slashQuery} onClose={closeSlashMenu} />
            </div>
          )}
        </div>

        <StatsBar editor={editor} />
      </div>

      {isFullscreen && <div className="fixed inset-0 bg-black/50 z-40 -z-10" onClick={() => setIsFullscreen(false)} />}
    </div>
  );
});

export default BlogEditor;
