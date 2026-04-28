import { useState } from 'react';
import AuthScreen from './auth/AuthScreen.jsx';
import ProductSelectScreen from './products/ProductSelectScreen.jsx';
import HotelsLanding from './landing/HotelsLanding.jsx';
import LeadGenLanding from './landing/LeadGenLanding.jsx';
import StressLanding from './landing/StressLanding.jsx';
import ConfirmDeleteDialog from './landing/ConfirmDeleteDialog.jsx';
import GlobalStatsScreen from './stats/GlobalStatsScreen.jsx';
import HotelStatsScreen from './stats/HotelStatsScreen.jsx';
import ConfigForm from './ConfigForm.jsx';
import LeadGenConfigForm from './leadgen/LeadGenConfigForm.jsx';
import StressConfigForm from './stress/StressConfigForm.jsx';

export default function App() {
  const [authed, setAuthed] = useState(false);
  if (!authed) return <AuthScreen onAuthed={() => setAuthed(true)} />;
  return <AdminUI />;
}

function AdminUI() {
  // Views:
  //   'products'         — post-login product picker
  //   'landing'          — best-price hotels list
  //   'form'             — best-price config form
  //   'global-stats'     — best-price all-hotels stats
  //   'hotel-stats'      — best-price single-hotel stats
  //   'lead-gen-landing' — lead-gen configurations list
  //   'lead-gen-form'    — lead-gen config form
  const [view, setView] = useState('products');
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statsTarget, setStatsTarget] = useState(null);

  function handleSelectProduct(productKey) {
    if (productKey === 'best-price-widget') {
      setView('landing');
    } else if (productKey === 'lead-gen') {
      setView('lead-gen-landing');
    } else if (productKey === 'stress-marketing') {
      setView('stress-landing');
    }
  }
  function handleBackToProducts() {
    setEditingHotelId(null);
    setStatsTarget(null);
    setDeleteTarget(null);
    setView('products');
  }

  // ── Best-price handlers ──────────────────────────────────────────
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
    setDeleteTarget({ hotelId, hotelName, product: 'best-price' });
  }
  function handleDeleteConfirmed() {
    const target =
      deleteTarget?.product === 'lead-gen'
        ? 'lead-gen-landing'
        : deleteTarget?.product === 'stress'
          ? 'stress-landing'
          : 'landing';
    setDeleteTarget(null);
    setView(target);
  }
  function handleBackToLanding() {
    setEditingHotelId(null);
    setView('landing');
  }
  function handleOpenGlobalStats() {
    setView('global-stats');
  }

  // ── Lead-gen handlers ───────────────────────────────────────────
  function handleLeadGenOpen(hotelId) {
    setEditingHotelId(hotelId);
    setView('lead-gen-form');
  }
  function handleLeadGenCreate() {
    setEditingHotelId(null);
    setView('lead-gen-form');
  }
  async function handleLeadGenDuplicate(sourceId) {
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
      const res = await fetch('/api/lead-gen/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, newId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Duplicate failed');
      setEditingHotelId(newId);
      setView('lead-gen-form');
    } catch (err) {
      alert(`Duplicate failed: ${err.message}`);
    }
  }
  function handleLeadGenDelete(hotelId, hotelName) {
    setDeleteTarget({ hotelId, hotelName, product: 'lead-gen' });
  }
  function handleBackToLeadGenLanding() {
    setEditingHotelId(null);
    setView('lead-gen-landing');
  }

  // ── Stress-marketing handlers ───────────────────────────────────
  function handleStressOpen(hotelId) {
    setEditingHotelId(hotelId);
    setView('stress-form');
  }
  function handleStressCreate() {
    setEditingHotelId(null);
    setView('stress-form');
  }
  async function handleStressDuplicate(sourceId) {
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
      const res = await fetch('/api/stress/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, newId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Duplicate failed');
      setEditingHotelId(newId);
      setView('stress-form');
    } catch (err) {
      alert(`Duplicate failed: ${err.message}`);
    }
  }
  function handleStressDelete(hotelId, hotelName) {
    setDeleteTarget({ hotelId, hotelName, product: 'stress' });
  }
  function handleBackToStressLanding() {
    setEditingHotelId(null);
    setView('stress-landing');
  }

  if (view === 'products') {
    return <ProductSelectScreen onSelect={handleSelectProduct} />;
  }

  if (view === 'lead-gen-landing') {
    return (
      <>
        <LeadGenLanding
          key={Date.now()}
          onOpen={handleLeadGenOpen}
          onCreate={handleLeadGenCreate}
          onDuplicate={handleLeadGenDuplicate}
          onDelete={handleLeadGenDelete}
          onBackToProducts={handleBackToProducts}
        />
        {deleteTarget && deleteTarget.product === 'lead-gen' && (
          <ConfirmDeleteDialog
            hotelId={deleteTarget.hotelId}
            hotelName={deleteTarget.hotelName}
            deleteEndpoint={`/api/lead-gen/config/${encodeURIComponent(deleteTarget.hotelId)}`}
            onConfirm={handleDeleteConfirmed}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </>
    );
  }

  if (view === 'lead-gen-form') {
    return (
      <LeadGenConfigForm
        editingHotelId={editingHotelId}
        onBack={handleBackToLeadGenLanding}
      />
    );
  }

  if (view === 'stress-landing') {
    return (
      <>
        <StressLanding
          key={Date.now()}
          onOpen={handleStressOpen}
          onCreate={handleStressCreate}
          onDuplicate={handleStressDuplicate}
          onDelete={handleStressDelete}
          onBackToProducts={handleBackToProducts}
        />
        {deleteTarget && deleteTarget.product === 'stress' && (
          <ConfirmDeleteDialog
            hotelId={deleteTarget.hotelId}
            hotelName={deleteTarget.hotelName}
            deleteEndpoint={`/api/stress/config/${encodeURIComponent(deleteTarget.hotelId)}`}
            onConfirm={handleDeleteConfirmed}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </>
    );
  }

  if (view === 'stress-form') {
    return (
      <StressConfigForm
        editingHotelId={editingHotelId}
        onBack={handleBackToStressLanding}
      />
    );
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
