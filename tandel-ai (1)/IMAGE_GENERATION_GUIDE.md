# Image Generation Feature

## Overview
Your Tandel AI app now includes AI-powered image generation using the AlphaAPI service.

## How to Use

### Generate an Image
1. **Type your image prompt** in the input field
   - Example: "a beautiful sunset over mountains"
   - Example: "a futuristic city with flying cars"
   
2. **Click the image icon** (🖼️) next to the send button
   - The icon appears between the text input and send button
   - It's only enabled when you have text in the input field

3. **Wait for generation**
   - The icon will show a spinning loader
   - Usually takes 2-5 seconds

4. **Image appears as attachment**
   - Generated image is added to your attachments
   - You can preview it before sending
   - Remove it if you don't like it and try again

5. **Send your message**
   - Click the send button to include the generated image in your chat
   - The AI will see and analyze the generated image

## Features

### Visual Feedback
- **Disabled state**: Gray icon when no text is entered
- **Active state**: Purple/green icon when ready to generate
- **Loading state**: Spinning animation during generation
- **Preview**: Generated image shows in attachment area

### Theme Support
- Works with all three themes (Light, Dark, Hacker)
- Purple accent in Light/Dark modes
- Green accent in Hacker mode

### Error Handling
- Shows alert if generation fails
- Allows retry without losing your prompt
- Handles network errors gracefully

## API Details

**Endpoint**: `http://imagegenerator.alphaapi.workers.dev`

**Request Format**:
```
GET /alphaapi/imagegenv2/?prompt=your+prompt+here
```

**Response Format**:
```json
{
  "success": true,
  "url": "https://tmpfiles.org/dl/10889104/image.jpg"
}
```

## Tips for Best Results

1. **Be descriptive**: More details = better images
2. **Use adjectives**: "vibrant", "detailed", "realistic"
3. **Specify style**: "photorealistic", "cartoon", "oil painting"
4. **Include context**: "in the style of...", "during sunset"

## Examples

Good prompts:
- "A majestic lion in the African savanna at golden hour"
- "Cyberpunk city street with neon lights and rain"
- "Cozy coffee shop interior with warm lighting"
- "Abstract geometric pattern in blue and gold"

## Troubleshooting

**Image won't generate?**
- Check your internet connection
- Try a simpler prompt
- Wait a moment and try again

**Image quality issues?**
- Try being more specific in your prompt
- Add style descriptors
- Regenerate with adjusted prompt
