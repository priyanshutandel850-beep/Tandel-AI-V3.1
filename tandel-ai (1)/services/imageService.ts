export interface ImageGenerationResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const generateImage = async (prompt: string): Promise<ImageGenerationResponse> => {
  try {
    // Use Pollinations.ai - a free, CORS-friendly image generation API
    // This API doesn't require authentication and has no CORS restrictions
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
    
    // Pollinations returns the image directly, so we just return the URL
    // The API automatically generates the image when the URL is accessed
    return {
      success: true,
      url: imageUrl
    };
    
  } catch (error) {
    console.error('Image generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
