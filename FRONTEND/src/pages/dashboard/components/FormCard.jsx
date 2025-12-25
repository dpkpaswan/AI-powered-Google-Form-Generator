import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FormCard = ({ form, onCopyLink, onOpenForm, onRegenerate }) => {
  const getTypeIcon = (type) => {
    const icons = {
      Survey: 'ClipboardList',
      Quiz: 'GraduationCap',
      Feedback: 'MessageSquare',
      Registration: 'UserPlus'
    };
    return icons?.[type] || 'FileText';
  };

  const getTypeColor = (type) => {
    const colors = {
      Survey: 'bg-primary/10 text-primary',
      Quiz: 'bg-accent/10 text-accent',
      Feedback: 'bg-secondary/10 text-secondary',
      Registration: 'bg-muted text-muted-foreground'
    };
    return colors?.[type] || 'bg-muted text-muted-foreground';
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d?.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="bg-card rounded-lg shadow-elevation-2 hover:shadow-elevation-3 transition-smooth p-4 md:p-6 border border-border">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-md flex items-center justify-center flex-shrink-0 ${getTypeColor(form?.type)}`}>
            <Icon name={getTypeIcon(form?.type)} size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-base md:text-lg text-card-foreground line-clamp-2 mb-1">
              {form?.title}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Created {formatDate(form?.createdAt)}
            </p>
          </div>
        </div>
        <div className={`px-2 py-1 md:px-3 md:py-1.5 rounded-md text-xs md:text-sm font-medium flex-shrink-0 ${getTypeColor(form?.type)}`}>
          {form?.type}
        </div>
      </div>
      <div className="space-y-2 md:space-y-3 mb-4">
        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
          <Icon name="Users" size={16} className="flex-shrink-0" />
          <span className="truncate">Audience: {form?.audience}</span>
        </div>
        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
          <Icon name="Globe" size={16} className="flex-shrink-0" />
          <span className="truncate">Language: {form?.language}</span>
        </div>
        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
          <Icon name="MessageCircle" size={16} className="flex-shrink-0" />
          <span className="truncate">Tone: {form?.tone}</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          iconName="Copy"
          iconPosition="left"
          onClick={() => onCopyLink(form?.id)}
          fullWidth
          className="sm:flex-1"
        >
          Copy Link
        </Button>
        <Button
          variant="outline"
          size="sm"
          iconName="ExternalLink"
          iconPosition="left"
          onClick={() => onOpenForm(form?.id)}
          fullWidth
          className="sm:flex-1"
        >
          Open
        </Button>
        <Button
          variant="ghost"
          size="sm"
          iconName="RefreshCw"
          onClick={() => onRegenerate(form?.id)}
          fullWidth
          className="sm:flex-shrink-0"
          aria-label="Regenerate form"
        />
      </div>
    </div>
  );
};

export default FormCard;