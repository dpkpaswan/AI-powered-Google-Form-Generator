import React from 'react';
import Icon from '../../../components/AppIcon';

const GenerationProgress = ({ isGenerating, progress }) => {
  if (!isGenerating) return null;

  const steps = [
    { id: 1, label: 'Analyzing description', icon: 'FileSearch' },
    { id: 2, label: 'Generating questions', icon: 'Sparkles' },
    { id: 3, label: 'Creating Google Form', icon: 'FileText' },
    { id: 4, label: 'Finalizing form', icon: 'CheckCircle2' }
  ];

  const currentStep = Math.min(Math.ceil((progress / 100) * steps?.length), steps?.length);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-200 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-elevation-5 p-6 md:p-8 lg:p-10 max-w-md w-full">
        <div className="text-center mb-6 md:mb-8">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Icon name="Sparkles" size={32} color="var(--color-primary)" />
          </div>
          <h3 className="text-xl md:text-2xl font-heading font-semibold text-foreground mb-2">
            Generating Your Form
          </h3>
          <p className="text-sm md:text-base text-muted-foreground">
            AI is creating your custom form...
          </p>
        </div>

        <div className="space-y-4 md:space-y-5 mb-6">
          {steps?.map((step) => {
            const isCompleted = step?.id < currentStep;
            const isCurrent = step?.id === currentStep;
            
            return (
              <div key={step?.id} className="flex items-center gap-3 md:gap-4">
                <div className={`
                  w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-smooth
                  ${isCompleted ? 'bg-success/20' : isCurrent ? 'bg-primary/20 animate-pulse' : 'bg-muted'}
                `}>
                  <Icon 
                    name={isCompleted ? 'Check' : step?.icon} 
                    size={20} 
                    color={isCompleted ? 'var(--color-success)' : isCurrent ? 'var(--color-primary)' : 'var(--color-muted-foreground)'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`
                    text-sm md:text-base font-medium transition-smooth
                    ${isCompleted ? 'text-success' : isCurrent ? 'text-primary' : 'text-muted-foreground'}
                  `}>
                    {step?.label}
                  </p>
                </div>
                {isCurrent && (
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-primary">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerationProgress;