import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FormTableRow = ({ form, isSelected, onSelect, onEdit, onCopy, onView, onAnalytics, onRegenerate, onDelete, busy = false }) => {
  const [showActions, setShowActions] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-success/10 text-success';
      case 'Draft':
        return 'bg-warning/10 text-warning';
      case 'Archived':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Survey':
        return 'ClipboardList';
      case 'Quiz':
        return 'GraduationCap';
      case 'Feedback':
        return 'MessageSquare';
      case 'Registration':
        return 'UserPlus';
      default:
        return 'FileText';
    }
  };

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-smooth">
      <td className="px-4 py-3 lg:px-6 lg:py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(form?.id, e?.target?.checked)}
          className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={`Select ${form?.title}`}
        />
      </td>
      <td className="px-4 py-3 lg:px-6 lg:py-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
            <Icon name={getTypeIcon(form?.type)} size={20} color="var(--color-primary)" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm lg:text-base text-foreground truncate">{form?.title}</h3>
            <p className="text-xs lg:text-sm text-muted-foreground mt-1 line-clamp-1">{form?.description}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 lg:px-6 lg:py-4 hidden md:table-cell">
        <span className="inline-flex items-center gap-2 text-sm text-foreground">
          <Icon name={getTypeIcon(form?.type)} size={16} />
          {form?.type}
        </span>
      </td>
      <td className="px-4 py-3 lg:px-6 lg:py-4 hidden lg:table-cell">
        <span className="text-sm text-muted-foreground">{form?.createdDate}</span>
      </td>
      <td className="px-4 py-3 lg:px-6 lg:py-4 hidden lg:table-cell">
        <span className="text-sm text-foreground">{form?.audience}</span>
      </td>
      <td className="px-4 py-3 lg:px-6 lg:py-4 hidden xl:table-cell">
        <span className="text-sm text-foreground">{form?.language}</span>
      </td>
      <td className="px-4 py-3 lg:px-6 lg:py-4 hidden md:table-cell">
        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(form?.status)}`}>
          {form?.status}
        </span>
      </td>
      <td className="px-4 py-3 lg:px-6 lg:py-4">
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(form)}
            className="hidden lg:inline-flex"
            aria-label="Edit form"
            disabled={busy}
          >
            <Icon name="Edit" size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCopy(form?.googleFormLink)}
            className="hidden lg:inline-flex"
            aria-label="Copy link"
            disabled={busy}
          >
            <Icon name="Copy" size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAnalytics?.(form)}
            className="hidden lg:inline-flex"
            aria-label="View analytics"
            disabled={busy}
          >
            <Icon name="BarChart3" size={18} />
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowActions(!showActions)}
              aria-label="More actions"
              aria-expanded={showActions}
              disabled={busy}
            >
              <Icon name="MoreVertical" size={18} />
            </Button>
            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-50"
                  onClick={() => setShowActions(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-popover rounded-md shadow-elevation-4 z-200 animate-slide-in">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        onEdit(form);
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-smooth text-popover-foreground text-sm"
                    >
                      <Icon name="Edit" size={16} />
                      Edit Parameters
                    </button>
                    <button
                      onClick={() => {
                        onCopy(form?.googleFormLink);
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-smooth text-popover-foreground text-sm"
                    >
                      <Icon name="Copy" size={16} />
                      Copy Link
                    </button>
                    <button
                      onClick={() => {
                        onAnalytics?.(form);
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-smooth text-popover-foreground text-sm"
                    >
                      <Icon name="BarChart3" size={16} />
                      View Analytics
                    </button>
                    <button
                      onClick={() => {
                        onRegenerate(form);
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-smooth text-popover-foreground text-sm"
                    >
                      <Icon name="RefreshCw" size={16} />
                      Regenerate
                    </button>
                    <div className="border-t border-border my-2" />
                    <button
                      onClick={() => {
                        onDelete(form?.id);
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-destructive/10 transition-smooth text-destructive text-sm"
                    >
                      <Icon name="Trash2" size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

export default FormTableRow;