import { useState, useCallback } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  List, ListOrdered, ListChecks, Quote,
  Code, Code2, Minus, Link as LinkIcon, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo2, Redo2, Highlighter, Palette, Type,
  Table as TableIcon, Maximize2, Minimize2,
  ChevronDown, Plus, Trash2, Merge, Split,
  RowsIcon, ColumnsIcon,
} from 'lucide-react';
import { TEXT_COLORS, HIGHLIGHT_COLORS, HEADING_LEVELS } from './extensions';

function ToolbarButton({ onClick, isActive, disabled, children, title, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-all duration-150 flex items-center justify-center
        ${isActive
          ? 'bg-[#224b82]/10 text-[#224b82] dark:bg-[#224b82]/20 dark:text-[#6da3e8]'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-0.5" />;
}

function DropdownMenu({ trigger, children, align = 'left' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={`absolute top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[180px] max-h-[300px] overflow-y-auto ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}>
            {children}
          </div>
        </>
      )}
    </div>
  );
}

function ColorPicker({ colors, onSelect, currentColor }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>
        <ToolbarButton isActive={!!currentColor}>
          <Palette size={16} />
          {currentColor && (
            <span
              className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full"
              style={{ backgroundColor: currentColor }}
            />
          )}
        </ToolbarButton>
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2 w-[200px]">
            <div className="grid grid-cols-6 gap-1">
              {colors.map((color) => (
                <button
                  key={color.value || 'default'}
                  type="button"
                  onClick={() => { onSelect(color.value); setIsOpen(false); }}
                  title={color.label}
                  className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
                    currentColor === color.value
                      ? 'border-[#224b82] ring-1 ring-[#224b82]/30'
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: color.value || '#374151' }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function HeadingDropdown({ editor }) {
  const currentLevel = editor.getAttributes('heading').level;

  return (
    <DropdownMenu
      trigger={
        <ToolbarButton className="gap-0.5 text-xs font-medium min-w-[80px] justify-between">
          <span>{currentLevel ? `H${currentLevel}` : 'Paragraph'}</span>
          <ChevronDown size={12} />
        </ToolbarButton>
      }
    >
      {HEADING_LEVELS.map((level) => (
        <button
          key={level.value}
          type="button"
          onClick={() => {
            if (level.value === 0) {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().toggleHeading({ level: level.value }).run();
            }
          }}
          className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            level.value === 0 && !editor.isActive('heading')
              ? 'bg-[#224b82]/10 text-[#224b82] dark:bg-[#224b82]/20 dark:text-[#6da3e8]'
              : currentLevel === level.value
              ? 'bg-[#224b82]/10 text-[#224b82] dark:bg-[#224b82]/20 dark:text-[#6da3e8]'
              : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {level.label}
        </button>
      ))}
    </DropdownMenu>
  );
}

export default function Toolbar({ editor, onOpenMediaLibrary }) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showTableMenu, setShowTableMenu] = useState(false);

  const setLink = useCallback(() => {
    if (!linkUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setShowLinkInput(false);
      setLinkUrl('');
      return;
    }
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank', rel: 'noopener noreferrer' }).run();
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const insertTable = useCallback((rows, cols) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setShowTableMenu(false);
  }, [editor]);

  if (!editor) return null;

  const currentTextColor = editor.getAttributes('textStyle').color || '';
  const currentHighlightColor = editor.getAttributes('highlight').color || '';

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10 rounded-t-lg">
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 size={16} />
      </ToolbarButton>

      <ToolbarDivider />

      <HeadingDropdown editor={editor} />

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough (Ctrl+Shift+X)"
      >
        <Strikethrough size={16} />
      </ToolbarButton>

      <ToolbarDivider />

      <ColorPicker
        colors={TEXT_COLORS}
        currentColor={currentTextColor}
        onSelect={(color) => {
          if (color) {
            editor.chain().focus().setColor(color).run();
          } else {
            editor.chain().focus().unsetColor().run();
          }
        }}
      />
      <ColorPicker
        colors={HIGHLIGHT_COLORS}
        currentColor={currentHighlightColor}
        onSelect={(color) => {
          editor.chain().focus().toggleHighlight({ color }).run();
        }}
      />

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Ordered List"
      >
        <ListOrdered size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive('taskList')}
        title="Task List"
      >
        <ListChecks size={16} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Blockquote"
      >
        <Quote size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Inline Code"
      >
        <Code size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code Block"
      >
        <Code2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <Minus size={16} />
      </ToolbarButton>

      <ToolbarDivider />

      <div className="relative">
        <ToolbarButton
          onClick={() => setShowLinkInput(!showLinkInput)}
          isActive={editor.isActive('link')}
          title="Link"
        >
          <LinkIcon size={16} />
        </ToolbarButton>
        {showLinkInput && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowLinkInput(false)} />
            <div className="absolute top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 w-[320px]">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#224b82]/30"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') setLink(); if (e.key === 'Escape') setShowLinkInput(false); }}
                />
                <button
                  type="button"
                  onClick={setLink}
                  className="px-3 py-1.5 text-sm bg-[#224b82] text-white rounded-md hover:bg-[#1a3a6b] transition-colors"
                >
                  Apply
                </button>
              </div>
              {editor.isActive('link') && (
                <button
                  type="button"
                  onClick={() => { editor.chain().focus().unsetLink().run(); setShowLinkInput(false); setLinkUrl(''); }}
                  className="mt-2 text-xs text-red-500 hover:text-red-600"
                >
                  Remove link
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="relative">
        <ToolbarButton
          onClick={() => setShowTableMenu(!showTableMenu)}
          isActive={editor.isActive('table')}
          title="Insert Table"
        >
          <TableIcon size={16} />
        </ToolbarButton>
        {showTableMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowTableMenu(false)} />
            <div className="absolute top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 w-[220px]">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Insert Table</p>
              <div className="space-y-2">
                {[
                  { label: '3 x 3', rows: 3, cols: 3 },
                  { label: '4 x 4', rows: 4, cols: 4 },
                  { label: '5 x 5', rows: 5, cols: 5 },
                ].map((size) => (
                  <button
                    key={size.label}
                    type="button"
                    onClick={() => insertTable(size.rows, size.cols)}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    {size.label}
                  </button>
                ))}
              </div>
              {editor.isActive('table') && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().addColumnAfter().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                  >
                    <Plus size={14} /> Add Column
                  </button>
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().addRowAfter().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                  >
                    <Plus size={14} /> Add Row
                  </button>
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().deleteColumn().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Delete Column
                  </button>
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().deleteRow().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Delete Row
                  </button>
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().mergeCells().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                  >
                    <Merge size={14} /> Merge Cells
                  </button>
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().splitCell().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                  >
                    <Split size={14} /> Split Cell
                  </button>
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().deleteTable().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Delete Table
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
        className="hidden"
      >
        <Minus size={16} />
      </ToolbarButton>

      {onOpenMediaLibrary && (
        <ToolbarButton
          onClick={onOpenMediaLibrary}
          title="Insert from Media Library"
        >
          <ImageIcon size={16} />
        </ToolbarButton>
      )}
    </div>
  );
}
