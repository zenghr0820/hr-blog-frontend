// utils/color.ts

// 这个函数会为不同的字符串生成不同的色相，但饱和度和明度保持一致，整体视觉柔和
export function stringToColor(str: string, options?: {
    saturation?: number;  // 0-100
    lightness?: number;   // 0-100
}) {
    const saturation = options?.saturation ?? 65;
    const lightness = options?.lightness ?? 75;

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = ((hash % 360) + 360) % 360; // 保证正数
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}