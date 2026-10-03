import React, { useState } from 'react';
import { Plus, Search, Calendar, User, DollarSign, Edit2, Trash2, FolderKanban, CheckCircle2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Project, ProjectStatus } from '../types';
import { Modal } from '../components/common/Modal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { formatCurrency, formatDate } from '../utils/formatters';

export const ProjectsPage: React.FC = () => {
  const {
    branches,
    projects,
    filteredProjects,
    saveProject,
    deleteProject,
    selectedBranchId,
    settings,
    getBranchCostBreakdown
  } = useData();
  const { canDeleteRecords } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [deleteModalProject, setDeleteModalProject] = useState<Project | null>(null);

  const displayProjects = filteredProjects.filter((p) => {
    const branch = branches.find((b) => b.id === p.branchId);
    return (
      p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.projectManager.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (branch?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleOpenCreate = () => {
    const targetBranchId = selectedBranchId !== 'all' ? selectedBranchId : branches[0]?.id || '';
    setEditingProject({
      branchId: targetBranchId,
      projectName: '',
      startDate: new Date().toISOString().slice(0, 10),
      expectedCompletionDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      projectManager: '',
      status: 'In Progress',
      estimatedBudget: 15000000,
      actualCost: 0,
      remainingBudget: 15000000,
      progressPercent: 20,
      notes: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject({ ...project });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editingProject.projectName || !editingProject.branchId) return;

    const estimated = Number(editingProject.estimatedBudget) || 0;
    const actual = Number(editingProject.actualCost) || 0;
    const remaining = estimated - actual;

    await saveProject({
      ...editingProject,
      estimatedBudget: estimated,
      actualCost: actual,
      remainingBudget: remaining
    });

    setIsFormOpen(false);
    setEditingProject(null);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by name, manager, branch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-hidden"
          />
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Setup Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displayProjects.map((project) => {
          const branch = branches.find((b) => b.id === project.branchId);
          const breakdown = getBranchCostBreakdown(project.branchId);
          const liveActualCost = breakdown.totalActual;
          const liveRemaining = (Number(project.estimatedBudget) || 0) - liveActualCost;
          const percentSpent = project.estimatedBudget > 0
            ? Math.min((liveActualCost / project.estimatedBudget) * 100, 100)
            : 0;

          return (
            <div
              key={project.id}
              className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col justify-between shadow-xs space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-sm">
                      {branch?.code || 'PROJECT'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {branch?.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(project)}
                      className="p-1 text-slate-400 hover:text-slate-800 rounded-xs hover:bg-slate-100"
                      title="Edit Project"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {canDeleteRecords && (
                      <button
                        onClick={() => setDeleteModalProject(project)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-xs hover:bg-rose-50"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {project.projectName}
                </h3>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    PM: <strong className="text-slate-700">{project.projectManager || 'Unassigned'}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(project.startDate)} → {formatDate(project.expectedCompletionDate)}
                  </span>
                  <span>
                    Status: <strong className="text-slate-800">{project.status}</strong>
                  </span>
                </div>
              </div>

              {/* Progress & Milestone */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-600">Fit-out Progress</span>
                  <span className="font-mono text-slate-900">{project.progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    style={{ width: `${project.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Financial Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Estimated Budget</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(project.estimatedBudget, settings.currencySymbol)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Live Actual Cost (Civil + Assets + Exp)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(liveActualCost, settings.currencySymbol)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-semibold">
                  <span className="text-slate-700">Remaining Budget</span>
                  <span
                    className={`font-mono ${
                      liveRemaining < 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {liveRemaining < 0
                      ? `Over Budget by ${formatCurrency(Math.abs(liveRemaining), settings.currencySymbol)}`
                      : formatCurrency(liveRemaining, settings.currencySymbol)}
                  </span>
                </div>
              </div>

              {project.notes && (
                <p className="text-xs text-slate-500 line-clamp-2 italic">
                  "{project.notes}"
                </p>
              )}
            </div>
          );
        })}
      </div>

      {displayProjects.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500 text-sm">
          No setup projects found. Click "New Setup Project" to launch a project.
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isFormOpen && editingProject && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={editingProject.id ? 'Edit Setup Project' : 'Create Branch Setup Project'}
          subtitle="Establish budgets, target handover dates, and milestones"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Branch *
                </label>
                <select
                  required
                  value={editingProject.branchId || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, branchId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} - {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clifton Flagship Launch & Complete Fit-out"
                  value={editingProject.projectName || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, projectName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Project Manager *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={editingProject.projectManager || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, projectManager: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Status *
                </label>
                <select
                  value={editingProject.status || 'In Progress'}
                  onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as ProjectStatus })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Near Completion">Near Completion</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={editingProject.startDate || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  value={editingProject.expectedCompletionDate || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, expectedCompletionDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Estimated Budget (PKR) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 18500000"
                  value={editingProject.estimatedBudget ?? ''}
                  onChange={(e) => setEditingProject({ ...editingProject, estimatedBudget: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Progress Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0 - 100"
                  value={editingProject.progressPercent ?? 0}
                  onChange={(e) => setEditingProject({ ...editingProject, progressPercent: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Project Notes & Milestones
                </label>
                <textarea
                  rows={3}
                  placeholder="Civil scope, MEP milestones, handover criteria..."
                  value={editingProject.notes || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md"
              >
                {editingProject.id ? 'Save Project' : 'Create Project'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteModalProject && (
        <DeleteConfirmModal
          isOpen={!!deleteModalProject}
          onClose={() => setDeleteModalProject(null)}
          onConfirm={async () => {
            await deleteProject(deleteModalProject.id);
          }}
          title="Delete Setup Project"
          message={`Are you sure you want to remove '${deleteModalProject.projectName}'?`}
        />
      )}
    </div>
  );
};
