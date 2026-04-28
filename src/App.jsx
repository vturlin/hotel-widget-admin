import { useState } from 'react';
import AuthScreen from './auth/AuthScreen.jsx';
import ProductSelectScreen from './products/ProductSelectScreen.jsx';
import HotelsLanding from './landing/HotelsLanding.jsx';
import ConfirmDeleteDialog from './landing/ConfirmDeleteDialog.jsx';
import GlobalStatsScreen from './stats/GlobalStatsScreen.jsx';
import HotelStatsScreen from './stats/HotelStatsScreen.jsx';
import ConfigForm from './ConfigForm.jsx';

export default function App() {
  const [authed, setAuthed] = useState(false);
  if (!authed) return <AuthScreen onAuthed={() => setAuthed(true)} />;
  return <AdminUI />;
}

function AdminUI() {
  // 'products' | 'landing' | 'form' | 'global-stats' | 'hotel-stats'
  // 'products' is the post-login product picker; only the
  // best-price-widget product currently lands on the hotels list.
  const [view, setView] = useState('products');
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Stored together so the hotel-stats screen can show a friendly name
  // in its title even though the API only needs the id.
  const [statsTarget, setStatsTarget] = useState(null);

  function handleSelectProduct(productKey) {
    if (productKey === 'best-price-widget') {
      setView('landing');
    }
    // Other products are placeholders today — the ProductSelectScreen
    // already disables their cards, so we shouldn't ever reach this
    // branch with another key.
  }
  function handleBackToProducts() {
    setEditingHotelId(null);
    setStatsTarget(null);
    setView('products');
  }

  function handleOpen(hotelId) {
    setEditingHotelId(hotelId);
    setView('form');
  }
  function handleOpenHotelStats(hotelId, hotelName) {
    setStatsTarget({ hotelId, hotelName });
    setView('hotel-stats');
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
  function handleOpenGlobalStats() {
    setView('global-stats');
  }

  if (view === 'products') {
    return <ProductSelectScreen onSelect={handleSelectProduct} />;
  }

  if (view === 'global-stats') {
    return <GlobalStatsScreen onBack={handleBackToLanding} />;
  }

  if (view === 'hotel-stats' && statsTarget) {
    return (
      <HotelStatsScreen
        hotelId={statsTarget.hotelId}
        hotelName={statsTarget.hotelName}
        onBack={handleBackToLanding}
      />
    );
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
          onOpenStats={handleOpenGlobalStats}
          onOpenHotelStats={handleOpenHotelStats}
          onBackToProducts={handleBackToProducts}
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
