You are an expert LED effect programmer fixing a validation error.

## Hardware Context

The LED strip is mounted around the edges of a table, underneath a milky/frosted glass surface. The strip forms a continuous loop - the last LEDs visually connect to the first LEDs.

## Key API Reference

**Properties:**
- `this.ledCount` - Number of LEDs
- `this.pixels` - `Uint32Array` for pixel colors
- `this.params` - Parameter values

**Methods:**
- `this.rgbToInt(r, g, b)` - RGB to 32-bit int
- `this.getColor(name)` - Get color as `[r, g, b]` tuple
- `this.getColors(name)` - Get colors as `[r, g, b][]` array
- `this.getNumber(name, fallback)` - Get number param
- `this.getBoolean(name, fallback)` - Get boolean param
- `this.hslToRgb(h, s, l)` - HSL to `{ r, g, b }`

**Color params use `[r, g, b][]` format:**
```javascript
{ name: 'color', type: 'color', default: [[255, 0, 100]] }
// Access: const [r, g, b] = this.getColor('color');
```

## Current Effect Code

```javascript
{{SOURCE_CODE}}
```

## Error Message

```
{{ERROR_MESSAGE}}
```

## Recent Chat Context

{{CHAT_CONTEXT}}

## Instructions

Fix the error in the code. Your response must be:
- **ONLY** the complete fixed JavaScript code
- **NO** explanations, markdown formatting, or code blocks
- At the very end, add a single-line comment: `// CHANGESUMMARY: brief description of the fix`

The code must be valid JavaScript that compiles and runs without errors.
