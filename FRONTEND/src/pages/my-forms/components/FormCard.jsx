import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FormCard = ({ form, isSelected, onSelect, onEdit, onCopy, onView, onAnalytics, onRegenerate, onDelete, busy = false }) => {
  const [showDetails, setShowDetails] = useState(false);

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
    <div className="bg-card rounded-md shadow-elevation-2 border border-border overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(form?.id, e?.target?.checked)}
            className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 mt-1"
            aria-label={`Select ${form?.title}`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                  <Icon name={getTypeIcon(form?.type)} size={20} color="var(--color-primary)" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-base text-foreground truncate">{form?.title}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium mt-1 ${getStatusColor(form?.status)}`}>
                    {form?.status}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{form?.description}</p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Icon name="Calendar" size={14} />
                {form?.createdDate}
              </span>
              <span className="flex items-center gap-1">
                <Icon name={getTypeIcon(form?.type)} size={14} />
                {form?.type}
              </span>
            </div>

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-smooth"
            >
              <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
              <Icon name={showDetails ? 'ChevronUp' : 'ChevronDown'} size={16} />
            </button>

            {showDetails && (
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Audience:</span>
                  <span className="text-foreground font-medium">{form?.audience}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Language:</span>
                  <span className="text-foreground font-medium">{form?.language}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Responses:</span>
                  <span className="text-foreground font-medium">{form?.responses}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(form)}
            iconName="Edit"
            iconPosition="left"
            iconSize={16}
            fullWidth
            disabled={busy}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopy(form?.googleFormLink)}
            iconName="Copy"
            iconPosition="left"
            iconSize={16}
            fullWidth
            disabled={busy}
          >
            Copy Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAnalytics?.(form)}
            iconName="BarChart3"
            iconPosition="left"
            iconSize={16}
            fullWidth
            disabled={busy}
          >
            Analytics
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRegenerate(form)}
            iconName="RefreshCw"
            iconPosition="left"
            iconSize={16}
            fullWidth
            disabled={busy}
          >
            Regenerate
          </Button>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(form?.id)}
          iconName="Trash2"
          iconPosition="left"
          iconSize={16}
          fullWidth
          disabled={busy}
          className="mt-2"
        >
          Delete Form
        </Button>
      </div>
    </div>
  );
};

export default FormCard;