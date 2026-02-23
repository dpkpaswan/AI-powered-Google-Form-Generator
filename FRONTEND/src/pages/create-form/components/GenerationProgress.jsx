import React, { useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const GenerationProgress = ({ isGenerating = false, progress = 0 }) => {
  if (!isGenerating) return null;

  // Clamp progress between 0–100
  const safeProgress = Math.max(0, Math.min(100, progress));

  const steps = useMemo(
    () => [
      { id: 1, label: 'Analyzing description', icon: 'FileSearch' },
      { id: 2, label: 'Generating questions', icon: 'Sparkles' },
      { id: 3, label: 'Creating Google Form', icon: 'FileText' },
      { id: 4, label: 'Finalizing form', icon: 'CheckCircle2' }
    ],
    []
  );

  const totalSteps = steps.length;

  const currentStep = useMemo(() => {
    if (safeProgress === 0) return 1;
    return Math.min(
      totalSteps,
      Math.ceil((safeProgress / 100) * totalSteps)
    );
  }, [safeProgress, totalSteps]);

  const currentStepLabel = steps[currentStep - 1]?.label;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <Icon name="Sparkles" size={34} color="var(--color-primary)" />
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
          </div>

          <h3 className="text-2xl font-semibold text-foreground mb-1">
            Generating Your Form
          </h3>

          <p className="text-sm text-muted-foreground">
            {currentStepLabel}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-5 mb-8">
          {steps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="flex items-center gap-4">
                <div
                  className={`
                    w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
                    ${
                      isCompleted
                        ? 'bg-green-500/20'
                        : isCurrent
                        ? 'bg-primary/20'
                        : 'bg-muted'
                    }
                  `}
                >
                  <Icon
                    name={isCompleted ? 'Check' : step.icon}
                    size={20}
                    color={
                      isCompleted
                        ? '#16a34a'
                        : isCurrent
                        ? 'var(--color-primary)'
                        : 'var(--color-muted-foreground)'
                    }
                  />
                </div>

                <div className="flex-1">
                  <p
                    className={`
                      text-sm font-medium transition-colors
                      ${
                        isCompleted
                          ? 'text-green-600'
                          : isCurrent
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }
                    `}
                  >
                    {step.label}
                  </p>
                </div>

                {isCurrent && (
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                    <div
                      className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-primary">
              {safeProgress}%
            </span>
          </div>

          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${safeProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerationProgress;