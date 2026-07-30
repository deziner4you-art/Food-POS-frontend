// @ts-nocheck
import React, { useState } from 'react';

import { Plus, Trash2, Edit2, UserCheck, Award, X } from 'lucide-react';

interface CMSStaffManagerViewProps {
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
}

export const CMSStaffManagerView: React.FC<CMSStaffManagerViewProps> = ({ staff, setStaff }) => {
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenAddModal = () => {
    setEditingStaff({
      id: `staff-${Date.now()}`,
      name: 'Chef Marcus Sterling',
      designation: 'Sous Chef',
      role: 'Culinary Team',
      photoUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=600&auto=format&fit=crop',
      bio: 'Master of authentic coal cooking techniques and modern fusion presentations.',
      specialtyDish: 'Flame Grilled Wagyu Steak',
      displayOrder: staff.length + 1,
      isVisible: true,
    });
    setIsModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setStaff((prev) => {
      const exists = prev.some((s) => s.id === editingStaff.id);
      if (exists) {
        return prev.map((s) => (s.id === editingStaff.id ? editingStaff : s));
      } else {
        return [...prev, editingStaff];
      }
    });
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm('Remove staff profile from website?')) {
      setStaff((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-display">
            Staff &amp; Executive Roster CMS
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage culinary team, head chefs, managers, photos, specialty dishes &amp; public bios.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-[#D4AF37] text-black font-extrabold text-xs px-4 py-2.5 rounded-xl gold-glow hover:bg-[#ffe088] transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Staff Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {staff.map((st) => (
          <div
            key={st.id}
            className="bg-[#16130B] border border-white/10 rounded-2xl overflow-hidden shadow-xl space-y-3 p-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#1A1A1D]">
                <img src={st.photoUrl} alt={st.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded font-bold">
                  {st.role} • {st.designation}
                </span>
                <h3 className="text-base font-bold text-white font-display mt-1">{st.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mt-1">{st.bio}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-[#D4AF37] font-semibold truncate max-w-[150px]">
                {st.specialtyDish}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingStaff({ ...st });
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg bg-[#1A1A1D] text-[#D4AF37]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteStaff(st.id)}
                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#16130B] border border-[#D4AF37]/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white font-display">
                Edit Staff Profile
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 text-gray-400 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-300">Staff Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full bg-[#1A1A1D] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-300">Role Title</label>
                  <input
                    type="text"
                    required
                    value={editingStaff.designation}
                    onChange={(e) => setEditingStaff({ ...editingStaff, designation: e.target.value })}
                    className="w-full bg-[#1A1A1D] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-300">Photo Image URL</label>
                  <input
                    type="text"
                    required
                    value={editingStaff.photoUrl}
                    onChange={(e) => setEditingStaff({ ...editingStaff, photoUrl: e.target.value })}
                    className="w-full bg-[#1A1A1D] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-300">Bio &amp; Culinary background</label>
                <textarea
                  rows={2}
                  value={editingStaff.bio}
                  onChange={(e) => setEditingStaff({ ...editingStaff, bio: e.target.value })}
                  className="w-full bg-[#1A1A1D] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1A1A1D] text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#D4AF37] text-black font-extrabold gold-glow"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

