'use client';

import { useState, useEffect } from 'react';

interface Note {
  id: number;
  note_text: string;
  created_at: string;
  updated_at: string;
  author_name: string;
}

interface PropertyNotesProps {
  propertyId: number;
}

export default function PropertyNotes({ propertyId }: PropertyNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [propertyId]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/properties/notes?property_id=${propertyId}`);
      const data = await response.json();

      if (data.success) {
        setNotes(data.notes);
      } else {
        setError(data.error || 'Failed to load notes');
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/properties/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          note_text: newNoteText,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewNoteText('');
        fetchNotes();
      } else {
        setError(data.error || 'Failed to add note');
      }
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateNote = async (noteId: number) => {
    if (!editText.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/properties/notes?id=${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_text: editText }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingNoteId(null);
        setEditText('');
        fetchNotes();
      } else {
        setError(data.error || 'Failed to update note');
      }
    } catch (err) {
      console.error('Error updating note:', err);
      setError('Failed to update note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    setError(null);

    try {
      const response = await fetch(`/api/properties/notes?id=${noteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchNotes();
      } else {
        setError(data.error || 'Failed to delete note');
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note');
    }
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditText(note.note_text);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditText('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {/* Add note form */}
      <form onSubmit={handleAddNote} className="mb-6">
        <textarea
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder="Add a note about this property..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          rows={3}
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving || !newNoteText.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {isSaving ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </form>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">No notes yet. Add your first note above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="border border-gray-200 rounded-lg p-4">
              {editingNoteId === note.id ? (
                <div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    rows={3}
                  />
                  <div className="mt-2 flex gap-2 justify-end">
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateNote(note.id)}
                      disabled={isSaving || !editText.trim()}
                      className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-800 whitespace-pre-wrap">{note.note_text}</p>
                  <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                    <div>
                      <span className="font-medium">{note.author_name}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(note.created_at)}</span>
                      {note.updated_at !== note.created_at && (
                        <span className="ml-2 text-gray-400">(edited)</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(note)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
