import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Pen, Edit, Trash2, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { DrawingCanvas } from './DrawingCanvas';
import backend from '~backend/client';
import type { Note } from '~backend/pomodoro/types';

export function Notes() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [createNoteType, setCreateNoteType] = useState<'text' | 'drawing'>('text');
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notes
  const { data: notesData, isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: () => backend.pomodoro.listNotes(),
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: (data: { title: string; content: string; type: 'text' | 'drawing' }) =>
      backend.pomodoro.createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsCreateDialogOpen(false);
      setNewNote({ title: '', content: '' });
      toast({
        title: 'Success',
        description: 'Note created successfully!',
      });
    },
    onError: (error) => {
      console.error('Failed to create note:', error);
      toast({
        title: 'Error',
        description: 'Failed to create note. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: (data: { id: number; title?: string; content?: string }) =>
      backend.pomodoro.updateNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setEditingNote(null);
      toast({
        title: 'Success',
        description: 'Note updated successfully!',
      });
    },
    onError: (error) => {
      console.error('Failed to update note:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (id: number) => backend.pomodoro.deleteNote({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({
        title: 'Success',
        description: 'Note deleted successfully!',
      });
    },
    onError: (error) => {
      console.error('Failed to delete note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleCreateNote = () => {
    if (!newNote.title.trim()) {
      toast({
        title: 'Error',
        description: 'Note title is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!newNote.content.trim()) {
      toast({
        title: 'Error',
        description: 'Note content is required.',
        variant: 'destructive',
      });
      return;
    }

    createNoteMutation.mutate({
      title: newNote.title.trim(),
      content: newNote.content,
      type: createNoteType,
    });
  };

  const handleUpdateNote = (note: Note, updates: Partial<Note>) => {
    updateNoteMutation.mutate({
      id: note.id,
      ...updates,
    });
  };

  const handleDeleteNote = (id: number) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(id);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading notes...</p>
          </div>
        </div>
      </div>
    );
  }

  const notes = notesData?.notes || [];
  const textNotes = notes.filter(note => note.type === 'text');
  const drawingNotes = notes.filter(note => note.type === 'drawing');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          <FileText className="w-8 h-8" />
          Notes
        </h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500/80 to-cyan-500/80 hover:from-emerald-600/80 hover:to-cyan-600/80 backdrop-blur-sm border border-emerald-400/30 text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800/95 backdrop-blur-xl border-white/20 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-slate-300">Title</Label>
                <Input
                  id="title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Enter note title"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-slate-400"
                />
              </div>

              <Tabs value={createNoteType} onValueChange={(value: 'text' | 'drawing') => setCreateNoteType(value)}>
                <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm">
                  <TabsTrigger value="text" className="flex items-center gap-2 text-slate-300 data-[state=active]:text-white">
                    <FileText className="w-4 h-4" />
                    Text Note
                  </TabsTrigger>
                  <TabsTrigger value="drawing" className="flex items-center gap-2 text-slate-300 data-[state=active]:text-white">
                    <Pen className="w-4 h-4" />
                    Drawing
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="text" className="space-y-4">
                  <div>
                    <Label htmlFor="content" className="text-slate-300">Content</Label>
                    <Textarea
                      id="content"
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                      placeholder="Write your thoughts..."
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-slate-400 min-h-32"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="drawing" className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Drawing</Label>
                    <DrawingCanvas
                      onChange={(data) => setNewNote({ ...newNote, content: data })}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)} 
                  className="border-white/20 text-slate-300 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateNote} 
                  disabled={createNoteMutation.isPending} 
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                >
                  {createNoteMutation.isPending ? 'Creating...' : 'Create Note'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {notes.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="text-center">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No notes yet</p>
            <p className="text-slate-500">Create your first note to capture ideas and thoughts</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-1 mb-6 shadow-2xl">
            <TabsList className="grid w-full grid-cols-3 bg-transparent gap-1">
              <TabsTrigger 
                value="all" 
                className="bg-transparent hover:bg-white/10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:border data-[state=active]:border-emerald-400/30 backdrop-blur-sm text-slate-300 data-[state=active]:text-white rounded-xl transition-all duration-200"
              >
                All Notes ({notes.length})
              </TabsTrigger>
              <TabsTrigger 
                value="text" 
                className="flex items-center gap-2 bg-transparent hover:bg-white/10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:border data-[state=active]:border-emerald-400/30 backdrop-blur-sm text-slate-300 data-[state=active]:text-white rounded-xl transition-all duration-200"
              >
                <FileText className="w-4 h-4" />
                Text ({textNotes.length})
              </TabsTrigger>
              <TabsTrigger 
                value="drawing" 
                className="flex items-center gap-2 bg-transparent hover:bg-white/10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:border data-[state=active]:border-emerald-400/30 backdrop-blur-sm text-slate-300 data-[state=active]:text-white rounded-xl transition-all duration-200"
              >
                <Pen className="w-4 h-4" />
                Drawings ({drawingNotes.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={setEditingNote}
                  onDelete={handleDeleteNote}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {textNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={setEditingNote}
                  onDelete={handleDeleteNote}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="drawing" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {drawingNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={setEditingNote}
                  onDelete={handleDeleteNote}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Edit Note Dialog */}
      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent className="bg-slate-800/95 backdrop-blur-xl border-white/20 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Note</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title" className="text-slate-300">Title</Label>
                <Input
                  id="edit-title"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white"
                />
              </div>
              
              {editingNote.type === 'text' ? (
                <div>
                  <Label htmlFor="edit-content" className="text-slate-300">Content</Label>
                  <Textarea
                    id="edit-content"
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white min-h-32"
                  />
                </div>
              ) : (
                <div>
                  <Label className="text-slate-300">Drawing</Label>
                  <DrawingCanvas
                    initialData={editingNote.content}
                    onChange={(data) => setEditingNote({ ...editingNote, content: data })}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingNote(null)} 
                  className="border-white/20 text-slate-300 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleUpdateNote(editingNote, {
                    title: editingNote.title,
                    content: editingNote.content,
                  })}
                  disabled={updateNoteMutation.isPending}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                >
                  {updateNoteMutation.isPending ? 'Updating...' : 'Update Note'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
  formatDate: (date: Date) => string;
}

function NoteCard({ note, onEdit, onDelete, formatDate }: NoteCardProps) {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 shadow-2xl transition-all hover:bg-white/10 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {note.type === 'text' ? (
            <FileText className="w-4 h-4 text-emerald-400" />
          ) : (
            <Pen className="w-4 h-4 text-cyan-400" />
          )}
          <h3 className="font-semibold text-white text-sm truncate">{note.title}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(note)}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 text-white h-7 w-7 p-0"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(note.id)}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 text-white h-7 w-7 p-0"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div className="mb-3">
        {note.type === 'text' ? (
          <p className="text-slate-300 text-sm line-clamp-3">
            {note.content}
          </p>
        ) : (
          <div className="bg-white/5 rounded-lg p-2 border border-white/10">
            <img 
              src={note.content} 
              alt="Drawing" 
              className="w-full h-24 object-contain rounded"
            />
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1 text-xs text-slate-400">
        <Calendar className="w-3 h-3" />
        {formatDate(note.updatedAt)}
      </div>
    </div>
  );
}
