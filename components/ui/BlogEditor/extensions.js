import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

export function getExtensions({ placeholder, characterLimit, onImageUpload, onOpenMediaLibrary } = {}) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      codeBlock: false,
      dropcursor: { color: '#224b82', width: 2, class: 'tiptap-dropcursor' },
      gapcursor: { class: 'tiptap-gapcursor' },
    }),

    CodeBlockLowlight.configure({
      lowlight,
      defaultLanguage: 'plaintext',
    }),

    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),

    Image.configure({
      inline: true,
      allowBase64: true,
      HTMLAttributes: {
        class: 'tiptap-editor-image',
      },
    }),

    Table.configure({
      resizable: true,
      handleWidth: 5,
      lastColumnResizable: true,
      HTMLAttributes: { class: 'tiptap-table' },
    }),
    TableRow,
    TableCell,
    TableHeader,

    TaskList.configure({ HTMLAttributes: { class: 'tiptap-task-list' } }),
    TaskItem.configure({ nested: true }),

    Placeholder.configure({
      placeholder: placeholder || 'Start writing...',
    }),

    CharacterCount.configure({
      limit: characterLimit || undefined,
    }),
  ];
}

export const TEXT_COLORS = [
  { label: 'Default', value: '' },
  { label: 'Gray', value: '#6b7280' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Yellow', value: '#ca8a04' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Purple', value: '#9333ea' },
  { label: 'Pink', value: '#db2777' },
  { label: 'PIOLEC Primary', value: '#224b82' },
  { label: 'PIOLEC Secondary', value: '#8760fd' },
  { label: 'PIOLEC Accent', value: '#f8b600' },
];

export const HIGHLIGHT_COLORS = [
  { label: 'Default', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Blue', value: '#bfdbfe' },
  { label: 'Purple', value: '#e9d5ff' },
  { label: 'Pink', value: '#fbcfe8' },
  { label: 'Red', value: '#fecaca' },
  { label: 'Orange', value: '#fed7aa' },
];

export const HEADING_LEVELS = [
  { label: 'Paragraph', value: 0 },
  { label: 'Heading 1', value: 1 },
  { label: 'Heading 2', value: 2 },
  { label: 'Heading 3', value: 3 },
  { label: 'Heading 4', value: 4 },
  { label: 'Heading 5', value: 5 },
  { label: 'Heading 6', value: 6 },
];

export const FONT_SIZES = [
  { label: 'Small', value: '0.875rem' },
  { label: 'Normal', value: '' },
  { label: 'Medium', value: '1.125rem' },
  { label: 'Large', value: '1.25rem' },
  { label: 'Huge', value: '1.5rem' },
];
