import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import DescriptionInput from './components/DescriptionInput';
import FormParameters from './components/FormParameters';
import GenerationProgress from './components/GenerationProgress';
import FormPreview from './components/FormPreview';
import { extractFromImages, generateForm } from '../../services/formGeneratorApi';
import { useLocation, useNavigate } from 'react-router-dom';

const CreateForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [description, setDescription] = useState('');
  const [parameters, setParameters] = useState({
    formType: 'survey',
    audience: 'students',
    language: 'english',
    tone: 'formal'
  });
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedForm, setGeneratedForm] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [didAutoGenerate, setDidAutoGenerate] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const state = location?.state;
    if (!state) return;

    const lower = (value) => (typeof value === 'string' ? value.toLowerCase() : value);

    // Fallback: use direct state payload if present.
    if (typeof state?.prompt === 'string' && state.prompt.trim()) {
      setDescription(state.prompt);
    }
    if (state?.formType || state?.audience || state?.language || state?.tone) {
      setParameters((prev) => ({
        ...prev,
        formType: lower(state?.formType) || prev.formType,
        audience: lower(state?.audience) || prev.audience,
        language: lower(state?.language) || prev.language,
        tone: lower(state?.tone) || prev.tone
      }));
    }
    if (state?.prompt || state?.regenerateFormId) {
      setGeneratedForm(null);
    }
  }, [location?.state]);

  useEffect(() => {
    const state = location?.state;
    if (!state?.autoGenerate) return;
    if (didAutoGenerate) return;
    if (isGenerating || isExtracting) return;

    // Wait for state propagation + validation requirements.
    const okDescription = typeof description === 'string' && description.trim().length >= 20;
    if (!okDescription) return;

    setDidAutoGenerate(true);
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.state, didAutoGenerate, description, isGenerating, isExtracting]);

  const validateForm = () => {
    const newErrors = {};

    const allowed = {
      formType: ['survey', 'quiz', 'feedback', 'registration'],
      audience: ['students', 'staff', 'public'],
      language: ['english', 'tamil', 'hindi'],
      tone: ['formal', 'academic', 'casual']
    };

    if (!allowed.formType.includes(parameters?.formType)) {
      newErrors.general = 'Please select a valid Form Type.';
    }
    if (!allowed.audience.includes(parameters?.audience)) {
      newErrors.general = 'Please select a valid Target Audience.';
    }
    if (!allowed.language.includes(parameters?.language)) {
      newErrors.general = 'Please select a valid Language.';
    }
    if (!allowed.tone.includes(parameters?.tone)) {
      newErrors.general = 'Please select a valid Tone.';
    }
    
    if (!description?.trim()) {
      newErrors.description = 'Please describe your form requirements';
    } else if (description?.trim()?.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleImagesSelected = (e) => {
    const files = Array.from(e?.target?.files || []).filter((f) => f && f.type && f.type.startsWith('image/'));
    setImageFiles(files);
  };

  const handleExtractFromImages = async () => {
    if (!imageFiles?.length) {
      setErrors((prev) => ({ ...prev, general: 'Please select at least one image to extract.' }));
      return;
    }

    setIsExtracting(true);
    setErrors({});
    try {
      const result = await extractFromImages({ images: imageFiles });
      const extractedPrompt = result?.extractedPrompt;
      if (!extractedPrompt) {
        throw new Error('No extracted text returned');
      }

      setDescription((prev) => {
        const left = String(prev || '').trim();
        const right = String(extractedPrompt || '').trim();
        return left ? `${left}\n\n${right}` : right;
      });

      setToastMessage('Extracted text from images. Review and edit, then Generate.');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (error) {
      const apiError = error?.response?.data?.error;
      const apiMessage = apiError?.message || error?.message;
      setErrors({
        general: apiMessage ? `Image extraction failed: ${apiMessage}` : 'Image extraction failed. Please try again.'
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const startProgressSimulation = () => {
    let progress = 0;
    const interval = setInterval(() => {
      // Keep moving forward, but don't finish until the API call resolves.
      progress += Math.random() * 12 + 6;
      setGenerationProgress(Math.min(progress, 95));
    }, 450);
    return () => clearInterval(interval);
  };

  const handleGenerate = async () => {
    if (!validateForm()) {
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGeneratedForm(null);
    setErrors({});

    const stopProgress = startProgressSimulation();

    try {
      const result = await generateForm({
        prompt: description,
        formType: parameters.formType,
        audience: parameters.audience,
        language: parameters.language,
        tone: parameters.tone
      });

      const questionTitles = Array.isArray(result?.questions)
        ? result.questions
            .map((q) => {
              if (typeof q === 'string') return q;
              const title = q?.title;
              const section = q?.section;
              if (!title) return null;
              return section ? `${section}: ${title}` : title;
            })
            .filter(Boolean)
        : [];

      setGenerationProgress(100);
      const formToStore = {
        id: result?.formId || `form_${Date.now()}`,
        title: result?.title || `${parameters.formType.charAt(0).toUpperCase() + parameters.formType.slice(1)} Form`,
        description: result?.description || description,
        type: parameters.formType.charAt(0).toUpperCase() + parameters.formType.slice(1),
        audience: parameters.audience.charAt(0).toUpperCase() + parameters.audience.slice(1),
        language: parameters.language.charAt(0).toUpperCase() + parameters.language.slice(1),
        tone: parameters.tone.charAt(0).toUpperCase() + parameters.tone.slice(1),
        questions: questionTitles,
        googleFormLink: result?.formUrl,
        prompt: description,
        createdAt: new Date().toISOString()
      };

      setGeneratedForm(formToStore);

      setToastMessage('Form generated successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (error) {
      const status = error?.response?.status;
      const apiError = error?.response?.data?.error;
      const apiMessageRaw =
        apiError?.message ||
        error?.response?.data?.message ||
        apiError ||
        error?.message;

      const apiMessage =
        typeof apiMessageRaw === 'string'
          ? apiMessageRaw
          : apiMessageRaw
            ? JSON.stringify(apiMessageRaw)
            : '';
      const isUnauthorized = status === 401 || apiError?.code === 'UNAUTHORIZED' || apiMessage === 'Unauthorized';
      const hint = isUnauthorized ? 'Unauthorized. Please sign in with Google again.' : null;

      setErrors({
        general: hint
          ? hint
          : apiMessage
            ? `Failed to generate form: ${apiMessage}`
            : 'Failed to generate form. Please try again.'
      });
    } finally {
      stopProgress();
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedForm?.googleFormLink) {
      navigator.clipboard?.writeText(generatedForm?.googleFormLink);
      setToastMessage('Link copied to clipboard!');
      setTimeout(() => setToastMessage(''), 2000);
    }
  };

  const handleOpenForm = () => {
    if (generatedForm?.googleFormLink) {
      window.open(generatedForm?.googleFormLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRegenerate = () => {
    setGeneratedForm(null);
    handleGenerate();
  };

  const handleSave = () => {
    if (!generatedForm?.id) return;
    setToastMessage('Saved. View it in My Forms.');
    setTimeout(() => setToastMessage(''), 2000);
    navigate('/my-forms');
  };

  const handleReset = () => {
    setDescription('');
    setParameters({
      formType: 'survey',
      audience: 'students',
      language: 'english',
      tone: 'formal'
    });
    setGeneratedForm(null);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-12 pb-28 md:pb-8 lg:pb-12">
          <div className="mb-6 md:mb-8 lg:mb-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                  Create New Form
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Describe your form requirements and let AI generate it for you
                </p>
              </div>
              
              {generatedForm && (
                <Button
                  variant="outline"
                  size="default"
                  iconName="RotateCcw"
                  iconPosition="left"
                  onClick={handleReset}
                  fullWidth
                  className="md:w-auto"
                >
                  Start New Form
                </Button>
              )}
            </div>
          </div>

          {errors?.general && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-md flex items-start gap-3">
              <Icon name="AlertCircle" size={20} color="var(--color-error)" className="flex-shrink-0 mt-0.5" />
              <p className="text-sm md:text-base text-error">{errors?.general}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
            <div className="space-y-6 md:space-y-8 min-w-0">
              <div className="bg-card rounded-lg shadow-elevation-3 p-4 md:p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-md flex items-center justify-center">
                    <Icon name="FileText" size={24} color="var(--color-primary)" />
                  </div>
                  <h2 className="text-lg md:text-xl lg:text-2xl font-heading font-semibold text-foreground">
                    Form Details
                  </h2>
                </div>

                <div className="space-y-6 md:space-y-8">
                  <DescriptionInput
                    value={description}
                    onChange={setDescription}
                    disabled={isGenerating || isExtracting}
                    error={errors?.description}
                  />

                  <div className="space-y-2">
                    <label className="text-sm md:text-base font-medium text-foreground">
                      Upload MCQ Images (optional)
                    </label>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Upload screenshots/photos of questions. We’ll convert them to editable text you can review before generating the Google Form.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImagesSelected}
                        disabled={isGenerating || isExtracting}
                        className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-muted file:text-foreground hover:file:bg-muted/80 disabled:opacity-50"
                      />
                      <Button
                        variant="outline"
                        size="default"
                        iconName="ScanText"
                        iconPosition="left"
                        onClick={handleExtractFromImages}
                        disabled={isGenerating || isExtracting || !imageFiles?.length}
                        fullWidth
                        className="sm:w-auto"
                      >
                        {isExtracting ? 'Extracting…' : 'Extract Text'}
                      </Button>
                    </div>
                    {!!imageFiles?.length && (
                      <p className="text-xs text-muted-foreground">
                        Selected {imageFiles.length} image{imageFiles.length > 1 ? 's' : ''}.
                      </p>
                    )}
                  </div>

                  <div className="border-t border-border pt-6 md:pt-8">
                    <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-4 md:mb-5">
                      Customize Parameters
                    </h3>
                    <FormParameters
                      parameters={parameters}
                      onChange={setParameters}
                      disabled={isGenerating}
                    />
                  </div>

                  <Button
                    variant="default"
                    size="xl"
                    iconName="Sparkles"
                    iconPosition="left"
                    onClick={handleGenerate}
                    disabled={isGenerating || !description?.trim()}
                    loading={isGenerating}
                    fullWidth
                    className="hidden md:inline-flex"
                  >
                    {isGenerating ? 'Generating Form...' : 'Generate Form with AI'}
                  </Button>
                </div>
              </div>

              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 md:p-5 lg:p-6">
                <div className="flex items-start gap-3">
                  <Icon name="Info" size={20} color="var(--color-accent)" className="flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm md:text-base font-medium text-foreground">
                      Tips for Better Results
                    </p>
                    <ul className="text-xs md:text-sm text-muted-foreground space-y-1.5">
                      <li>• Be specific about the questions you need</li>
                      <li>• Mention any required sections or categories</li>
                      <li>• Specify question types (multiple choice, text, rating, etc.)</li>
                      <li>• Include any special requirements or constraints</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start min-w-0">
              {generatedForm ? (
                <FormPreview
                  formData={generatedForm}
                  onCopy={handleCopyLink}
                  onOpen={handleOpenForm}
                  onRegenerate={handleRegenerate}
                  onSave={handleSave}
                  isGenerating={isGenerating}
                />
              ) : (
                <div className="bg-card rounded-lg shadow-elevation-3 p-6 md:p-8 lg:p-10 text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                    <Icon name="FileQuestion" size={40} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-2">
                    No Form Generated Yet
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-6">
                    Fill in the form details and click "Generate Form with AI" to create your custom form
                  </p>
                  <div className="grid grid-cols-2 gap-3 md:gap-4 text-left">
                    <div className="bg-muted/50 rounded-md p-3 md:p-4">
                      <Icon name="Zap" size={20} className="text-primary mb-2" />
                      <p className="text-xs md:text-sm font-medium text-foreground">Fast Generation</p>
                      <p className="text-xs text-muted-foreground mt-1">AI creates forms in seconds</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-3 md:p-4">
                      <Icon name="Target" size={20} className="text-accent mb-2" />
                      <p className="text-xs md:text-sm font-medium text-foreground">Customizable</p>
                      <p className="text-xs text-muted-foreground mt-1">Tailored to your needs</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-3 md:p-4">
                      <Icon name="Globe" size={20} className="text-secondary mb-2" />
                      <p className="text-xs md:text-sm font-medium text-foreground">Multi-language</p>
                      <p className="text-xs text-muted-foreground mt-1">Support for 3 languages</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-3 md:p-4">
                      <Icon name="Link" size={20} className="text-success mb-2" />
                      <p className="text-xs md:text-sm font-medium text-foreground">Google Forms</p>
                      <p className="text-xs text-muted-foreground mt-1">Direct integration</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {!generatedForm && (
        <div className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-background/95 backdrop-blur border-t border-border">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <Button
              variant="default"
              size="xl"
              iconName="Sparkles"
              iconPosition="left"
              onClick={handleGenerate}
              disabled={isGenerating || !description?.trim()}
              loading={isGenerating}
              fullWidth
            >
              {isGenerating ? 'Generating Form...' : 'Generate Form with AI'}
            </Button>
          </div>
        </div>
      )}

      <GenerationProgress 
        isGenerating={isGenerating} 
        progress={generationProgress} 
      />
      {toastMessage && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-200 animate-slide-in">
          <div className="bg-success text-success-foreground rounded-md shadow-elevation-4 px-4 py-3 md:px-5 md:py-4 flex items-center gap-3 max-w-sm">
            <Icon name="CheckCircle2" size={20} />
            <p className="text-sm md:text-base font-medium">
              {toastMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateForm;