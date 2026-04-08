import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Link as LinkIcon,
  Palette,
} from 'lucide-react';
import { cn } from '../lib/utils';

// Add this to your globals.css or a separate css file for Tiptap styles
/*
.ProseMirror {
  outline: none;
}
.ProseMirror p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
ul[data-type="taskList"] {
  list-style: none;
  padding: 0;
}
ul[data-type="taskList"] li {
  display: flex;
}
ul[data-type="taskList"] li > label {
  flex: 0 0 auto;
  margin-right: 0.5rem;
  user-select: none;
}
ul[data-type="taskList"] li > div {
  flex: 1 1 auto;
}
*/

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
}

const MenuButton = ({
  isActive,
  onClick,
  children,
  title,
}: {
  isActive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      'p-1.5 rounded-md hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900',
      isActive && 'bg-slate-100 text-slate-900 shadow-sm'
    )}
  >
    {children}
  </button>
);

export default function RichTextEditor({
  content,
  onChange,
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextStyle,
      Color,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none max-w-none min-h-[150px] px-4 py-3 text-slate-700',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Insira a URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
      {editable && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/50">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Negrito"
          >
            <Bold className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Itálico"
          >
            <Italic className="w-4 h-4" />
          </MenuButton>
          
          <div className="w-px h-4 bg-slate-200 mx-1" />

          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Título 1"
          >
            <Heading1 className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Título 2"
          >
            <Heading2 className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Título 3"
          >
            <Heading3 className="w-4 h-4" />
          </MenuButton>

          <div className="w-px h-4 bg-slate-200 mx-1" />

          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Lista com marcadores"
          >
            <List className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Lista numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive('taskList')}
            title="Lista de tarefas"
          >
            <CheckSquare className="w-4 h-4" />
          </MenuButton>

          <div className="w-px h-4 bg-slate-200 mx-1" />

          <MenuButton
            onClick={setLink}
            isActive={editor.isActive('link')}
            title="Link"
          >
            <LinkIcon className="w-4 h-4" />
          </MenuButton>
          
          <div className="flex items-center gap-1">
             <input
                type="color"
                onInput={(event) => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
                value={editor.getAttributes('textStyle').color || '#000000'}
                className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                title="Cor do texto"
              />
          </div>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
