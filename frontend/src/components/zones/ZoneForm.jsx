import { useState } from 'react';
import api from '../../services/api';

export default function ZoneForm({ zone, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name:         zone?.name         ?? '',
    api_url:      zone?.api_url      ?? '',
    api_username: zone?.api_username ?? '',
    api_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (zone) {
        const payload = { ...form };
        if (!payload.api_password) delete payload.api_password;
        await api.put(`/zones/${zone.id}`, payload);
      } else {
        await api.post('/zones', form);
      }
      onSaved?.();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      setError(
        errors
          ? Object.values(errors).flat().join(' ')
          : err?.response?.data?.message ?? 'Erreur lors de la sauvegarde.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="label">Nom de la zone</label>
        <input className="input" value={form.name} onChange={set('name')} required placeholder="Usine A" />
      </div>
      <div>
        <label className="label">URL de l'API</label>
        <input className="input" value={form.api_url} onChange={set('api_url')} required placeholder="http://example.com" type="url" />
      </div>
      <div>
        <label className="label">Nom d'utilisateur</label>
        <input className="input" value={form.api_username} onChange={set('api_username')} required placeholder="admin" />
      </div>
      <div>
        <label className="label">
          Mot de passe
          {zone && <span className="text-slate-400 font-normal ml-1">(laisser vide pour ne pas changer)</span>}
        </label>
        <input className="input" type="password" value={form.api_password} onChange={set('api_password')} required={!zone} placeholder="••••••••" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
          {loading ? 'Enregistrement…' : zone ? 'Mettre à jour' : 'Créer la zone'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Annuler
        </button>
      </div>
    </form>
  );
}
