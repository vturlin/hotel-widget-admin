import { useState } from 'react';
import AuthScreen from './auth/AuthScreen.jsx';
import HotelsLanding from './landing/HotelsLanding.jsx';
import ConfirmDeleteDialog from './landing/ConfirmDeleteDialog.jsx';
import ConfigForm from './ConfigForm.jsx';

export default function App() {
  const [authed, setAuthed] = useState(false);
  if (!authed) return <AuthScreen onAuthed={() => setAuthed(true)} />;
  return <AdminUI />;
}

function AdminUI() {
  const [view, setView] = useState('landing');
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function handleOpen(hotelId) {
    setEditingHotelId(hotelId);
    setView('form');
  }
  function handleCreate() {
    setEditingHotelId(null);
    setView('form');
  }
  async function handleDuplicate(sourceId) {
    const newId = prompt(
      `Duplicate "${sourceId}" to a new Hotel ID:`,
      `${sourceId}_copy`
    );
    if (!newId) return;
    if (!/^[a-zA-Z0-9_-]+$/.test(newId)) {
      alert('Invalid ID. Use letters, numbers, dashes and underscores only.');
      return;
    }
    try {
      const res = await fetch('/api/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, newId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Duplicate failed');
      setEditingHotelId(newId);
      setView('form');
    } catch (err) {
      alert(`Duplicate failed: ${err.message}`);
    }
  }
  function handleDelete(hotelId, hotelName) {
    setDeleteTarget({ hotelId, hotelName });
  }
  function handleDeleteConfirmed() {
    setDeleteTarget(null);
    setView('landing');
  }
  function handleBackToLanding() {
    setEditingHotelId(null);
    setView('landing');
  }

  if (view === 'landing') {
    return (
      <>
        <HotelsLanding
          key={Date.now()}
          onOpen={handleOpen}
          onCreate={handleCreate}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
        {deleteTarget && (
          <ConfirmDeleteDialog
            hotelId={deleteTarget.hotelId}
            hotelName={deleteTarget.hotelName}
            onConfirm={handleDeleteConfirmed}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </>
    );
  }

  return (
    <ConfigForm editingHotelId={editingHotelId} onBack={handleBackToLanding} />
  );
}
