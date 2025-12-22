'use client';

import { useState } from 'react';
import styles from './generate.module.css';

// Content themes (recipe example - customize for your use case)
const CONTENT_THEMES = [
  { value: 'asian-fusion', label: 'Asian Fusion', description: 'Teriyaki bowls, stir-fries, noodle dishes' },
  { value: 'mediterranean', label: 'Mediterranean', description: 'Greek, Italian, Middle Eastern flavors' },
  { value: 'mexican', label: 'Mexican', description: 'Tacos, burrito bowls, fajitas' },
  { value: 'quick-meals', label: 'Quick Meals', description: 'Ready in 20 minutes or less' },
  { value: 'high-protein', label: 'High Protein', description: 'Muscle-building, lean meats' },
  { value: 'vegetarian', label: 'Vegetarian', description: 'Plant-based, no meat' },
];

// Image models
const IMAGE_MODELS = [
  { value: 'recraft-v3', label: 'Recraft V3', description: 'Best quality' },
  { value: 'flux-1.1-pro', label: 'Flux 1.1 Pro', description: 'Fast & good' },
  { value: 'ideogram-v3', label: 'Ideogram V3', description: 'Best prompt adherence' },
];

interface GenerationResult {
  content: any;
  imageUrl?: string;
  stats: {
    textCost?: number;
    imageCost?: number;
    textDuration?: number;
    imageDuration?: number;
  };
}

export default function GeneratePage() {
  const [selectedTheme, setSelectedTheme] = useState('asian-fusion');
  const [selectedModel, setSelectedModel] = useState('recraft-v3');
  const [customPrompt, setCustomPrompt] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState('');

  // Generate content
  const handleGenerateContent = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const theme = CONTENT_THEMES.find(t => t.value === selectedTheme);
      const prompt = customPrompt || buildDefaultPrompt(theme!);

      const response = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }

      // Try to parse JSON from response
      let parsedContent = {};
      let extractedImagePrompt = '';

      try {
        // Look for JSON in response
        const jsonMatch = data.result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedContent = JSON.parse(jsonMatch[0]);
        }

        // Look for image prompt section
        const imageMatch = data.result.match(/IMAGE PROMPT:?\s*([\s\S]+?)(?:$|---)/i);
        if (imageMatch) {
          extractedImagePrompt = imageMatch[1].trim();
          setImagePrompt(extractedImagePrompt);
        }
      } catch (e) {
        console.log('Could not parse JSON from response');
        parsedContent = { rawText: data.result };
      }

      setResult({
        content: parsedContent,
        stats: {
          textCost: data.cost,
          textDuration: data.duration,
        },
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate image
  const handleGenerateImage = async () => {
    if (!imagePrompt) {
      setError('No image prompt available');
      return;
    }

    setIsGeneratingImage(true);
    setError('');

    try {
      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setResult(prev => ({
        ...prev!,
        imageUrl: data.imageUrl,
        stats: {
          ...prev?.stats,
          imageCost: data.cost,
          imageDuration: data.duration,
        },
      }));

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Save content
  const handleSave = async () => {
    if (!result?.content) return;

    setIsSaving(true);
    setError('');

    try {
      // Optimize image first if we have one
      let optimizedImages: string[] = [];

      if (result.imageUrl) {
        const slug = result.content.slug || `content-${Date.now()}`;

        const optimizeResponse = await fetch('/api/optimize-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: result.imageUrl,
            slug,
          }),
        });

        const optimizeData = await optimizeResponse.json();
        if (optimizeData.success) {
          optimizedImages = [optimizeData.image.webp];
        }
      }

      // Save to backend
      const saveResponse = await fetch('/api/backend/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: result.content.title || 'Untitled',
          slug: result.content.slug || `content-${Date.now()}`,
          type: 'recipe',
          content: result.content,
          images: optimizedImages,
          metadata: result.stats,
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(saveData.error || 'Failed to save');
      }

      alert('Saved successfully!');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Content Generator</h1>
        <p>Generate content and images with AI</p>
      </header>

      <div className={styles.grid}>
        {/* Left Panel - Configuration */}
        <div className={styles.panel}>
          <h2>Configuration</h2>

          {/* Theme Selector */}
          <div className={styles.section}>
            <label className={styles.label}>Content Theme</label>
            <div className={styles.themeGrid}>
              {CONTENT_THEMES.map(theme => (
                <button
                  key={theme.value}
                  className={`${styles.themeButton} ${selectedTheme === theme.value ? styles.selected : ''}`}
                  onClick={() => setSelectedTheme(theme.value)}
                >
                  <span className={styles.themeLabel}>{theme.label}</span>
                  <span className={styles.themeDesc}>{theme.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Image Model Selector */}
          <div className={styles.section}>
            <label className={styles.label}>Image Model</label>
            <select
              className={styles.select}
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {IMAGE_MODELS.map(model => (
                <option key={model.value} value={model.value}>
                  {model.label} - {model.description}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Prompt */}
          <div className={styles.section}>
            <label className={styles.label}>Custom Prompt (optional)</label>
            <textarea
              className={styles.textarea}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Leave empty to use default prompt based on theme..."
            />
          </div>

          {/* Generate Button */}
          <button
            className={styles.generateButton}
            onClick={handleGenerateContent}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Content'}
          </button>
        </div>

        {/* Right Panel - Results */}
        <div className={styles.panel}>
          <h2>Results</h2>

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          {result?.content && (
            <div className={styles.resultSection}>
              <h3>Generated Content</h3>
              <pre className={styles.jsonOutput}>
                {JSON.stringify(result.content, null, 2)}
              </pre>

              {/* Image Prompt */}
              <div className={styles.section}>
                <label className={styles.label}>Image Prompt</label>
                <textarea
                  className={styles.textarea}
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Image prompt will be extracted or enter custom..."
                />
                <button
                  className={styles.secondaryButton}
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage || !imagePrompt}
                >
                  {isGeneratingImage ? 'Generating Image...' : 'Generate Image'}
                </button>
              </div>

              {/* Generated Image */}
              {result.imageUrl && (
                <div className={styles.imageResult}>
                  <h4>Generated Image</h4>
                  <img src={result.imageUrl} alt="Generated" />
                </div>
              )}

              {/* Stats */}
              <div className={styles.stats}>
                {result.stats.textCost && (
                  <span>Text: ${result.stats.textCost.toFixed(4)}</span>
                )}
                {result.stats.imageCost && (
                  <span>Image: ${result.stats.imageCost.toFixed(4)}</span>
                )}
              </div>

              {/* Save Button */}
              <button
                className={styles.saveButton}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save to Database'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Build default prompt based on theme
function buildDefaultPrompt(theme: { value: string; label: string; description: string }) {
  return `You are a content creator. Generate a recipe with the following theme: ${theme.label} (${theme.description}).

Create a complete recipe with these fields:
- title: A catchy, descriptive title
- slug: URL-friendly version of title
- description: 1-2 sentence description
- prepTime: minutes
- cookTime: minutes
- servings: number
- difficulty: easy/medium/hard
- ingredients: array of ingredient strings
- steps: array of step strings
- nutrition: { calories, protein, carbs, fat }
- tags: array of relevant tags

Return the recipe as JSON, then provide an IMAGE PROMPT section describing how to photograph this dish.

OUTPUT FORMAT:
{json recipe here}

IMAGE PROMPT:
A realistic food photograph of [dish]...`;
}
