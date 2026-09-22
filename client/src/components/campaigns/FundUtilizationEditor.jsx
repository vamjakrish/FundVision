import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, AlertCircle, PieChart, Sparkles, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Badge } from '../ui';
import { proofAPI } from '../../services/api';

export default function FundUtilizationEditor({
  items = [],
  onChange,
  goalAmount = 0,
  campaignId,
  readOnly = false,
  onSaved,
}) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ purpose: '', estimatedAmount: '', description: '' });
  const [newForm, setNewForm] = useState({ purpose: '', estimatedAmount: '', description: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalUtilization = (items || []).reduce(
    (sum, item) => sum + (Number(item.estimatedAmount) || 0),
    0
  );

  const parsedGoal = Number(goalAmount) || 0;
  const difference = totalUtilization - parsedGoal;
  const percentage = parsedGoal > 0 ? Math.round((totalUtilization / parsedGoal) * 100) : 0;

  // Validate item
  const validateItem = (item) => {
    if (!item.purpose || !item.purpose.trim()) {
      toast.error('Purpose is required');
      return false;
    }
    if (item.purpose.trim().length > 200) {
      toast.error('Purpose cannot exceed 200 characters');
      return false;
    }
    const amt = Number(item.estimatedAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Estimated amount must be a valid positive number greater than ₹0');
      return false;
    }
    if (item.description && item.description.trim().length > 1000) {
      toast.error('Description cannot exceed 1000 characters');
      return false;
    }
    return true;
  };

  const handleAddItem = () => {
    if (!validateItem(newForm)) return;

    const newItem = {
      purpose: newForm.purpose.trim(),
      estimatedAmount: Number(newForm.estimatedAmount),
      description: newForm.description ? newForm.description.trim() : '',
    };

    const updated = [...(items || []), newItem];
    onChange?.(updated);
    setNewForm({ purpose: '', estimatedAmount: '', description: '' });
    setIsAdding(false);
    toast.success('Allocation item added');
  };

  const handleStartEdit = (index) => {
    setEditingIndex(index);
    setEditForm({
      purpose: items[index].purpose,
      estimatedAmount: items[index].estimatedAmount,
      description: items[index].description || '',
    });
  };

  const handleSaveEdit = (index) => {
    if (!validateItem(editForm)) return;

    const updated = [...items];
    updated[index] = {
      purpose: editForm.purpose.trim(),
      estimatedAmount: Number(editForm.estimatedAmount),
      description: editForm.description ? editForm.description.trim() : '',
    };

    onChange?.(updated);
    setEditingIndex(null);
    toast.success('Allocation item updated');
  };

  const handleDeleteItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    onChange?.(updated);
    if (editingIndex === index) setEditingIndex(null);
    toast.success('Item removed');
  };

  const handleDirectSave = async () => {
    if (!campaignId) return;
    if (!items || items.length === 0) {
      toast.error('Please add at least one fund utilization item');
      return;
    }

    setSaving(true);
    try {
      const res = await proofAPI.updateFundUtilization(campaignId, {
        fundUtilization: items.map((i) => ({
          purpose: i.purpose,
          estimatedAmount: Number(i.estimatedAmount),
          description: i.description || undefined,
        })),
      });

      if (res.data?.success) {
        toast.success('Fund utilization plan saved successfully! 🎉');
        onSaved?.(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save fund utilization');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Explanation */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" />
            Fund Utilization Breakdown
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Transparently allocate how donations will be utilized across project expenses.
          </p>
        </div>

        {campaignId && !readOnly && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleDirectSave}
            disabled={saving || items.length === 0}
            icon={Save}
            iconPosition="left"
          >
            {saving ? 'Saving Plan...' : 'Save Utilization Plan'}
          </Button>
        )}
      </div>

      {/* Goal vs Utilization Summary Banner */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Planned Utilization
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              ₹{totalUtilization.toLocaleString()}
            </div>
          </div>

          {parsedGoal > 0 && (
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Campaign Goal
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                ₹{parsedGoal.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar & Feedback */}
        {parsedGoal > 0 && (
          <div className="mt-3">
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  percentage === 100
                    ? 'bg-green-500'
                    : percentage > 100
                    ? 'bg-amber-500'
                    : 'bg-primary'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-slate-500 font-medium">
                Allocated: <strong className="text-slate-700 dark:text-slate-200">{percentage}%</strong> of goal
              </span>

              {difference === 0 ? (
                <span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Exact match with campaign goal
                </span>
              ) : difference < 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Remaining to allocate: ₹{Math.abs(difference).toLocaleString()}
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Exceeds goal by ₹{difference.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Utilization Items List */}
      <div className="space-y-3">
        {items && items.length > 0 ? (
          items.map((item, index) => {
            const isEditing = editingIndex === index;

            if (isEditing) {
              return (
                <div
                  key={index}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-primary shadow-sm space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Purpose / Category *
                      </label>
                      <input
                        type="text"
                        value={editForm.purpose}
                        onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
                        placeholder="e.g. ICU & Surgeon Charges"
                        className="input-field !py-2 text-sm"
                        maxLength={200}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Estimated Amount (₹) *
                      </label>
                      <input
                        type="number"
                        value={editForm.estimatedAmount}
                        onChange={(e) => setEditForm({ ...editForm, estimatedAmount: e.target.value })}
                        placeholder="150000"
                        min="1"
                        className="input-field !py-2 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Description / Itemization (Optional)
                    </label>
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Brief note on what this covers"
                      className="input-field !py-2 text-xs"
                      maxLength={1000}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingIndex(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSaveEdit(index)}
                      icon={Check}
                      iconPosition="left"
                    >
                      Update Item
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={index}
                className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/40 transition-colors gap-3 flex-wrap sm:flex-nowrap"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
                      {item.purpose}
                    </p>
                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    ₹{Number(item.estimatedAmount).toLocaleString()}
                  </span>

                  {!readOnly && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(index)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Item"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(index)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50">
            <PieChart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              No fund allocations added yet
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Break down how the requested goal amount will be utilized to earn donor trust.
            </p>
          </div>
        )}
      </div>

      {/* Add New Item Form / Button */}
      {!readOnly && (
        <div>
          {isAdding ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-primary" /> New Allocation Item
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Purpose / Category *
                  </label>
                  <input
                    type="text"
                    value={newForm.purpose}
                    onChange={(e) => setNewForm({ ...newForm, purpose: e.target.value })}
                    placeholder="e.g. Medicine & Diagnostics"
                    className="input-field !py-2 text-sm"
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Estimated Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={newForm.estimatedAmount}
                    onChange={(e) => setNewForm({ ...newForm, estimatedAmount: e.target.value })}
                    placeholder="50000"
                    min="1"
                    className="input-field !py-2 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Description / Itemization (Optional)
                </label>
                <input
                  type="text"
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  placeholder="e.g. Antibiotics, saline drips, and lab blood tests"
                  className="input-field !py-2 text-xs"
                  maxLength={1000}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAdding(false);
                    setNewForm({ purpose: '', estimatedAmount: '', description: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddItem}
                  icon={Plus}
                  iconPosition="left"
                >
                  Add to Breakdown
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAdding(true)}
              icon={Plus}
              iconPosition="left"
              className="w-full !py-2.5 border-dashed"
            >
              Add Allocation Item
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
