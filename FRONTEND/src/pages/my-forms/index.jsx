import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import FormTableRow from './components/FormTableRow';
import FormCard from './components/FormCard';
import FilterToolbar from './components/FilterToolbar';
import BulkActionsBar from './components/BulkActionsBar';
import EmptyState from './components/EmptyState';
import { bulkArchiveMyForms, deleteMyForm, listMyForms } from '../../services/formsApi';

const MyForms = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [selectedForms, setSelectedForms] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'createdDate', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    audience: 'all',
    language: 'all',
    status: 'all',
    dateRange: 'all'
  });
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [toast, setToast] = useState(null);
  const [busyAction, setBusyAction] = useState(null);

  const [forms, setForms] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { forms: rows } = await listMyForms();
        if (cancelled) return;
        setForms(rows || []);
      } catch {
        if (!cancelled) setForms([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Better default for mobile: table is hard to use on small screens.
    if (typeof window !== 'undefined' && window.matchMedia) {
      const isSmall = window.matchMedia('(max-width: 767px)').matches;
      if (isSmall) setViewMode('grid');
    }
  }, []);

  const normalizedForms = useMemo(() => {
    const titleCase = (value) => {
      if (!value) return '';
      const s = String(value);
      return s.charAt(0).toUpperCase() + s.slice(1);
    };

    return (forms || []).map((f) => {
      const createdDate = f?.createdDate || (f?.created_at ? new Date(f.created_at).toISOString().slice(0, 10) : '');
      const type = titleCase(f?.form_type || 'survey');
      const audience = titleCase(f?.audience || 'students');
      const language = titleCase(f?.language || 'english');
      const tone = titleCase(f?.tone || 'formal');
      const status = f?.archived ? 'Archived' : 'Active';

      return {
        id: f?.google_form_id,
        title: f?.title,
        description: f?.description || '',
        type,
        createdDate,
        audience,
        language,
        tone,
        status,
        responses: typeof f?.responses === 'number' ? f.responses : 0,
        googleFormLink: f?.responder_url || f?.google_form_url,
        editUrl: f?.edit_url
      };
    });
  }, [forms]);

  const filteredAndSortedForms = useMemo(() => {
    let filtered = [...normalizedForms];

    if (searchQuery?.trim()) {
      const query = searchQuery?.toLowerCase();
      filtered = filtered?.filter(form => 
        form?.title?.toLowerCase()?.includes(query) || 
        form?.description?.toLowerCase()?.includes(query)
      );
    }

    if (filters?.type !== 'all') {
      filtered = filtered?.filter(form => form?.type === filters?.type);
    }
    if (filters?.audience !== 'all') {
      filtered = filtered?.filter(form => form?.audience === filters?.audience);
    }
    if (filters?.language !== 'all') {
      filtered = filtered?.filter(form => form?.language === filters?.language);
    }
    if (filters?.status !== 'all') {
      filtered = filtered?.filter(form => form?.status === filters?.status);
    }
    if (filters?.dateRange !== 'all') {
      const now = new Date();
      const formDate = (dateStr) => new Date(dateStr);
      
      switch (filters?.dateRange) {
        case 'today':
          filtered = filtered?.filter(form => {
            const date = formDate(form?.createdDate);
            return date?.toDateString() === now?.toDateString();
          });
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered?.filter(form => formDate(form?.createdDate) >= weekAgo);
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          filtered = filtered?.filter(form => formDate(form?.createdDate) >= monthAgo);
          break;
        case 'quarter':
          const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          filtered = filtered?.filter(form => formDate(form?.createdDate) >= quarterAgo);
          break;
        case 'year':
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          filtered = filtered?.filter(form => formDate(form?.createdDate) >= yearAgo);
          break;
        default:
          break;
      }
    }

    filtered?.sort((a, b) => {
      let aValue = a?.[sortConfig?.key];
      let bValue = b?.[sortConfig?.key];

      if (sortConfig?.key === 'createdDate') {
        aValue = new Date(aValue)?.getTime();
        bValue = new Date(bValue)?.getTime();
      }

      if (typeof aValue === 'string') {
        aValue = aValue?.toLowerCase();
        bValue = bValue?.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig?.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig?.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [normalizedForms, filters, sortConfig, searchQuery]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectForm = (formId, isSelected) => {
    setSelectedForms(prev => 
      isSelected 
        ? [...prev, formId]
        : prev?.filter(id => id !== formId)
    );
  };

  const handleSelectAll = (isSelected) => {
    setSelectedForms(isSelected ? filteredAndSortedForms?.map(form => form?.id) : []);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      type: 'all',
      audience: 'all',
      language: 'all',
      status: 'all',
      dateRange: 'all'
    });
    setSearchQuery('');
  };

  const handleCopyLink = (link) => {
    if (!link) {
      setToast({ variant: 'error', message: 'No responder link available for this form.' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    navigator.clipboard?.writeText(link);
    setShowCopyNotification(true);
    setTimeout(() => setShowCopyNotification(false), 2000);
  };

  const handleOpenForm = (link) => {
    if (!link) return;
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleEdit = (form) => {
    if (!form?.id) return;
    navigate(`/forms/${encodeURIComponent(form.id)}/edit`);
  };

  const handleView = (form) => {
    handleOpenForm(form?.googleFormLink);
  };

  const handleAnalytics = (form) => {
    // Placeholder behavior: open Google editor if available.
    if (form?.editUrl) {
      window.open(form.editUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setToast({ variant: 'info', message: 'Analytics coming soon.' });
    setTimeout(() => setToast(null), 2500);
  };

  const handleRegenerate = (form) => {
    if (!form?.id) return;
    const ok = window.confirm('Regenerate this form using AI? This will create a NEW Google Form.');
    if (!ok) return;

    setBusyAction('regenerate');
    setTimeout(() => setBusyAction(null), 400);

    navigate('/create-form', {
      state: {
        prompt: form?.description || '',
        formType: (form?.type || '').toLowerCase(),
        audience: (form?.audience || '').toLowerCase(),
        language: (form?.language || '').toLowerCase(),
        tone: (form?.tone || '').toLowerCase(),
        autoGenerate: true,
        regenerateFormId: form?.id
      }
    });
  };

  const handleDelete = async (formId) => {
    if (!formId) return;
    const ok = window.confirm('Delete this form from your dashboard? This does not delete it from Google Drive.');
    if (!ok) return;

    setBusyAction('delete');
    try {
      await deleteMyForm(formId);
      setForms((prev) => (prev || []).filter((f) => f?.google_form_id !== formId));
      setSelectedForms((prev) => prev.filter((id) => id !== formId));
      setToast({ variant: 'success', message: 'Form deleted.' });
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      const apiError = e?.response?.data?.error;
      const msg = apiError?.message || e?.message || 'Failed to delete form.';
      setToast({ variant: 'error', message: msg });
      setTimeout(() => setToast(null), 3500);
    } finally {
      setBusyAction(null);
    }
  };

  const handleBulkExport = () => {
    if (!selectedForms?.length) return;
    const selected = filteredAndSortedForms.filter((f) => selectedForms.includes(f.id));
    const escapeCsv = (value) => {
      const s = String(value ?? '');
      if (/[\n\r",]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const headers = ['Title', 'CreatedDate', 'Type', 'Audience', 'Language', 'Tone', 'ResponderUrl', 'EditUrl'];
    const rows = selected.map((f) => [
      f.title,
      f.createdDate,
      f.type,
      f.audience,
      f.language,
      f.tone,
      f.googleFormLink,
      f.editUrl
    ]);

    const csv = [headers, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forms-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setToast({ variant: 'success', message: 'Exported selected forms.' });
    setTimeout(() => setToast(null), 2500);
    setSelectedForms([]);
  };

  const handleBulkArchive = async () => {
    if (!selectedForms?.length) return;
    const ok = window.confirm(`Archive ${selectedForms.length} form${selectedForms.length === 1 ? '' : 's'}?`);
    if (!ok) return;

    setBusyAction('archive');
    try {
      await bulkArchiveMyForms({ formIds: selectedForms, archived: true });
      setForms((prev) => (prev || []).map((f) => (selectedForms.includes(f?.google_form_id) ? { ...f, archived: true } : f)));
      setToast({ variant: 'success', message: 'Archived selected forms.' });
      setTimeout(() => setToast(null), 2500);
      setSelectedForms([]);
    } catch (e) {
      const apiError = e?.response?.data?.error;
      const msg = apiError?.message || e?.message || 'Failed to archive forms.';
      setToast({ variant: 'error', message: msg });
      setTimeout(() => setToast(null), 3500);
    } finally {
      setBusyAction(null);
    }
  };

  const handleBulkShare = () => {
    if (!selectedForms?.length) return;
    const selected = filteredAndSortedForms.filter((f) => selectedForms.includes(f.id));
    const links = selected.map((f) => f.googleFormLink).filter(Boolean);
    if (!links.length) {
      setToast({ variant: 'error', message: 'No responder links to share.' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    navigator.clipboard?.writeText(links.join('\n'));
    setToast({ variant: 'success', message: 'Copied selected responder links.' });
    setTimeout(() => setToast(null), 2500);
    setSelectedForms([]);
  };

  const handleBulkDelete = async () => {
    if (!selectedForms?.length) return;
    const ok = window.confirm(`Delete ${selectedForms.length} form${selectedForms.length === 1 ? '' : 's'} from your dashboard?`);
    if (!ok) return;

    setBusyAction('delete');
    try {
      await Promise.all(selectedForms.map((id) => deleteMyForm(id)));
      setForms((prev) => (prev || []).filter((f) => !selectedForms.includes(f?.google_form_id)));
      setToast({ variant: 'success', message: 'Deleted selected forms.' });
      setTimeout(() => setToast(null), 2500);
      setSelectedForms([]);
    } catch (e) {
      const apiError = e?.response?.data?.error;
      const msg = apiError?.message || e?.message || 'Failed to delete one or more forms.';
      setToast({ variant: 'error', message: msg });
      setTimeout(() => setToast(null), 3500);
    } finally {
      setBusyAction(null);
    }
  };

  const hasActiveFilters = 
    filters?.type !== 'all' || 
    filters?.audience !== 'all' || 
    filters?.language !== 'all' || 
    filters?.status !== 'all' || 
    filters?.dateRange !== 'all' ||
    searchQuery?.trim() !== '';

  const SortButton = ({ columnKey, label }) => (
    <button
      onClick={() => handleSort(columnKey)}
      className="flex items-center gap-2 hover:text-primary transition-smooth"
    >
      <span>{label}</span>
      {sortConfig?.key === columnKey && (
        <Icon 
          name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
          size={16} 
        />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="max-w-9xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 lg:mb-8">
            <div>
              <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-2">
                My Forms
              </h1>
              <p className="text-sm lg:text-base text-muted-foreground">
                Manage and organize all your generated forms
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-muted rounded-md p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded transition-smooth ${
                    viewMode === 'table' ?'bg-background shadow-elevation-1' :'hover:bg-background/50'
                  }`}
                  aria-label="Table view"
                >
                  <Icon name="Table" size={18} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-smooth ${
                    viewMode === 'grid' ?'bg-background shadow-elevation-1' :'hover:bg-background/50'
                  }`}
                  aria-label="Grid view"
                >
                  <Icon name="LayoutGrid" size={18} />
                </button>
              </div>
              <Button
                variant="default"
                onClick={() => navigate('/create-form')}
                iconName="Plus"
                iconPosition="left"
                iconSize={18}
              >
                Create New Form
              </Button>
            </div>
          </div>

          <FilterToolbar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            resultCount={filteredAndSortedForms?.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {filteredAndSortedForms?.length === 0 ? (
            <EmptyState 
              hasFilters={hasActiveFilters} 
              onClearFilters={handleClearFilters} 
            />
          ) : (
            <>
              {viewMode === 'table' ? (
                <div className="bg-card rounded-md shadow-elevation-2 border border-border overflow-hidden">
                  <div className="overflow-x-auto scrollbar-custom">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="px-4 py-3 lg:px-6 lg:py-4 text-left">
                            <input
                              type="checkbox"
                              checked={selectedForms?.length === filteredAndSortedForms?.length && filteredAndSortedForms?.length > 0}
                              onChange={(e) => handleSelectAll(e?.target?.checked)}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
                              aria-label="Select all forms"
                            />
                          </th>
                          <th className="px-4 py-3 lg:px-6 lg:py-4 text-left text-sm font-medium text-foreground">
                            <SortButton columnKey="title" label="Form Title" />
                          </th>
                          <th className="px-4 py-3 lg:px-6 lg:py-4 text-left text-sm font-medium text-foreground hidden md:table-cell">
                            <SortButton columnKey="type" label="Type" />
                          </th>
                          <th className="px-4 py-3 lg:px-6 lg:py-4 text-left text-sm font-medium text-foreground hidden lg:table-cell">
                            <SortButton columnKey="createdDate" label="Created" />
                          </th>
                          <th className="px-4 py-3 lg:px-6 lg:py-4 text-left text-sm font-medium text-foreground hidden lg:table-cell">
                            <SortButton columnKey="audience" label="Audience" />
                          </th>
                          <th className="px-4 py-3 lg:px-6 lg:py-4 text-left text-sm font-medium text-foreground hidden xl:table-cell">
                            <SortButton columnKey="language" label="Language" />
                          </th>
                          <th className="px-4 py-3 lg:px-6 lg:py-4 text-left text-sm font-medium text-foreground hidden md:table-cell">
                            <SortButton columnKey="status" label="Status" />
                          </th>
                          <th className="px-4 py-3 lg:px-6 lg:py-4 text-right text-sm font-medium text-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedForms?.map(form => (
                          <FormTableRow
                            key={form?.id}
                            form={form}
                            isSelected={selectedForms?.includes(form?.id)}
                            onSelect={handleSelectForm}
                            onEdit={handleEdit}
                            onCopy={handleCopyLink}
                            onView={handleView}
                            onAnalytics={handleAnalytics}
                            onRegenerate={handleRegenerate}
                            onDelete={handleDelete}
                            busy={!!busyAction}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {filteredAndSortedForms?.map(form => (
                    <FormCard
                      key={form?.id}
                      form={form}
                      isSelected={selectedForms?.includes(form?.id)}
                      onSelect={handleSelectForm}
                      onEdit={handleEdit}
                      onCopy={handleCopyLink}
                      onView={handleView}
                      onAnalytics={handleAnalytics}
                      onRegenerate={handleRegenerate}
                      onDelete={handleDelete}
                      busy={!!busyAction}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          <BulkActionsBar
            selectedCount={selectedForms?.length}
            onExport={handleBulkExport}
            onArchive={handleBulkArchive}
            onShare={handleBulkShare}
            onDelete={handleBulkDelete}
            onClearSelection={() => setSelectedForms([])}
            busy={!!busyAction}
          />

          {showCopyNotification && (
            <div className="fixed bottom-4 right-4 z-100 bg-success text-success-foreground px-4 py-3 rounded-md shadow-elevation-4 flex items-center gap-3 animate-slide-in">
              <Icon name="Check" size={20} />
              <span className="text-sm font-medium">Link copied to clipboard!</span>
            </div>
          )}

          {toast?.message && (
            <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-100 animate-slide-in">
              <div
                className={
                  `rounded-md shadow-elevation-4 px-4 py-3 md:px-5 md:py-4 flex items-center gap-3 max-w-sm ` +
                  (toast.variant === 'success'
                    ? 'bg-success text-success-foreground'
                    : toast.variant === 'error'
                      ? 'bg-error text-error-foreground'
                      : 'bg-muted text-foreground')
                }
              >
                <Icon name={toast.variant === 'success' ? 'CheckCircle2' : toast.variant === 'error' ? 'AlertCircle' : 'Info'} size={20} />
                <p className="text-sm md:text-base font-medium">{toast.message}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyForms;