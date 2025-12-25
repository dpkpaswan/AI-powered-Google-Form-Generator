import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FormPreview = ({ formData, onCopy, onOpen, onRegenerate, onSave, isGenerating }) => {
  if (!formData) return null;

  return (
    <div className="bg-card rounded-lg shadow-elevation-3 p-4 md:p-6 lg:p-8 transition-smooth overflow-hidden">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-xl md:text-2xl lg:text-3xl font-heading font-semibold text-foreground">
          Generated Form Preview
        </h3>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 rounded-md">
          <Icon name="CheckCircle2" size={16} color="var(--color-success)" />
          <span className="text-xs md:text-sm font-medium text-success">Generated</span>
        </div>
      </div>
      <div className="space-y-4 md:space-y-6">
        <div className="bg-muted/50 rounded-md p-4 md:p-5 lg:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
              <Icon name="FileText" size={20} color="var(--color-primary)" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base md:text-lg lg:text-xl font-heading font-semibold text-foreground mb-1">
                {formData?.title}
              </h4>
              <p className="text-xs md:text-sm text-muted-foreground">
                {formData?.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Icon name="FileType" size={16} className="text-muted-foreground" />
              <span className="text-xs md:text-sm text-foreground">
                <span className="font-medium">Type:</span> {formData?.type}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Users" size={16} className="text-muted-foreground" />
              <span className="text-xs md:text-sm text-foreground">
                <span className="font-medium">Audience:</span> {formData?.audience}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Globe" size={16} className="text-muted-foreground" />
              <span className="text-xs md:text-sm text-foreground">
                <span className="font-medium">Language:</span> {formData?.language}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="MessageSquare" size={16} className="text-muted-foreground" />
              <span className="text-xs md:text-sm text-foreground">
                <span className="font-medium">Tone:</span> {formData?.tone}
              </span>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs md:text-sm font-medium text-foreground mb-2">
              Form Questions Preview:
            </p>
            <div className="space-y-2">
              {formData?.questions?.map((question, index) => (
                <div key={index} className="flex items-start gap-2 text-xs md:text-sm text-muted-foreground">
                  <span className="font-medium text-primary">{index + 1}.</span>
                  <span className="min-w-0 break-words">{question}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-accent/5 rounded-md p-4 md:p-5 border border-accent/20">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Link" size={18} color="var(--color-accent)" />
            <p className="text-sm md:text-base font-medium text-foreground">
              Google Form Link
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-nowrap gap-2 md:gap-3 min-w-0">
            <div className="flex-1 min-w-0 bg-background rounded-md px-3 md:px-4 py-2.5 md:py-3 border border-border">
              <p className="text-xs md:text-sm text-foreground font-mono break-all sm:truncate">
                {formData?.googleFormLink}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="default"
                iconName="Copy"
                iconPosition="left"
                onClick={onCopy}
                fullWidth
                className="sm:flex-none"
              >
                Copy
              </Button>
              <Button
                variant="default"
                size="default"
                iconName="ExternalLink"
                iconPosition="left"
                onClick={onOpen}
                fullWidth
                className="sm:flex-none"
              >
                Open
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2">
          <Button
            variant="outline"
            size="lg"
            iconName="RefreshCw"
            iconPosition="left"
            onClick={onRegenerate}
            disabled={isGenerating}
            fullWidth
            className="sm:flex-1"
          >
            Regenerate Form
          </Button>
          <Button
            variant="default"
            size="lg"
            iconName="Save"
            iconPosition="left"
            onClick={onSave}
            disabled={isGenerating}
            fullWidth
            className="sm:flex-1"
          >
            Save to My Forms
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FormPreview;