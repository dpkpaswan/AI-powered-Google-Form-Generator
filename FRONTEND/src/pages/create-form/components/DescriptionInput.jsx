import React from 'react';
import Icon from '../../../components/AppIcon';

const DescriptionInput = ({ value, onChange, disabled, error }) => {
  const characterCount = value?.length;
  const maxCharacters = 5000;
  const isNearLimit = characterCount > maxCharacters * 0.8;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="form-description" className="text-sm md:text-base font-medium text-foreground">
          Describe Your Form
          <span className="text-error ml-1">*</span>
        </label>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs md:text-sm font-medium ${isNearLimit ? 'text-warning' : 'text-muted-foreground'}`}>
            {characterCount}/{maxCharacters}
          </span>
        </div>
      </div>
      <p className="text-xs md:text-sm text-muted-foreground">
        Describe what you want in your form using natural language. Be specific about questions, sections, and any special requirements.
      </p>
      <div className="relative">
        <textarea
          id="form-description"
          value={value}
          onChange={(e) => onChange(e?.target?.value)}
          disabled={disabled}
          maxLength={maxCharacters}
          placeholder="Example: I need a student feedback form for my computer science course. Include questions about course content quality, teaching methods, lab sessions, and overall satisfaction. Add a section for suggestions and improvements."
          className={`
            w-full min-h-[180px] md:min-h-[220px] lg:min-h-[260px] px-4 py-3 md:px-5 md:py-4
            bg-background border rounded-md
            text-sm md:text-base text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-y transition-smooth
            ${error ? 'border-error' : 'border-input'}
          `}
          aria-describedby={error ? 'description-error' : 'description-help'}
          aria-invalid={error ? 'true' : 'false'}
        />
        
        {!value && !disabled && (
          <div className="absolute top-3 right-3 md:top-4 md:right-4">
            <Icon name="Sparkles" size={20} className="text-primary opacity-40" />
          </div>
        )}
      </div>
      {error && (
        <div id="description-error" className="flex items-center gap-2 text-xs md:text-sm text-error">
          <Icon name="AlertCircle" size={16} />
          <span>{error}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2 md:gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5 rounded-md">
          <Icon name="Lightbulb" size={14} className="text-primary" />
          <span className="text-xs text-primary font-medium">Be specific</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-accent/5 rounded-md">
          <Icon name="List" size={14} className="text-accent" />
          <span className="text-xs text-accent font-medium">List all sections</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary/5 rounded-md">
          <Icon name="Target" size={14} className="text-secondary" />
          <span className="text-xs text-secondary font-medium">Mention question types</span>
        </div>
      </div>
    </div>
  );
};

export default DescriptionInput;