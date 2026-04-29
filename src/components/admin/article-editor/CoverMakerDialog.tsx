'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { addToast } from '@heroui/react';
import { X, Plus, ImageIcon, Search, Loader2 } from 'lucide-react';

// 动态加载外部字体(仅在组件挂载时执行一次)
const loadExternalFont = () => {
  if (typeof document === 'undefined') return;
  
  // 检查是否已经加载过
  const existingLink = document.getElementById('xuanzongti-font');
  if (existingLink) return;
  
  const link = document.createElement('link');
  link.id = 'xuanzongti-font';
  link.rel = 'stylesheet';
  // link.href = 'https://fontsapi.zeoseven.com/970/main/result.css';
  link.href = 'https://fontsapi.zeoseven.com/445/main/result.css'; // 云峰静龙行书 https://fonts.zeoseven.com/items/445/
  document.head.appendChild(link);
};

interface TextElement {
  text: string;
  x: number; // 百分比 0-100
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
}

interface AvatarElement {
  src: string;
  x: number;
  y: number;
  size: number; // 像素
}

interface PlatformPhoto {
  id: string;
  url: string;
  thumbnail: string;
}

interface CoverMakerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageUrl: string) => void;
  title?: string;
  author?: string;
  avatar?: string;
}

const IMAGE_API_URL = 'https://pixhub.flec.top';
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const EXPORT_WIDTH = 1200;
const EXPORT_HEIGHT = 675;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function CoverMakerDialog({ isOpen, onClose, onSave, title: initialTitle, author: initialAuthor, avatar: initialAvatar }: CoverMakerProps) {
  // ---------- 字体加载 ----------
  useEffect(() => {
    loadExternalFont();
  }, []);

  // ---------- 状态 ----------
  const [imageSource, setImageSource] = useState<'unsplash' | 'pixabay' | 'pexels' | 'upload'>('unsplash');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformPhotos, setPlatformPhotos] = useState<PlatformPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PlatformPhoto | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  const [imageUrl, setImageUrl] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(60);

  const [textElements, setTextElements] = useState<{
    title: TextElement;
    subtitle: TextElement;
    author: TextElement;
    avatar: AvatarElement;
  }>({
    title: {
      text: initialTitle || '',
      x: 50,
      y: 40,
      fontSize: 148,
      fontFamily: 'YFJLXS, sans-serif',
      color: '#ffffff',
    },
    subtitle: {
      text: '',
      x: 50,
      y: 25,
      fontSize: 78,
      fontFamily: 'YFJLXS, sans-serif',
      color: '#ffffff',
    },
    author: {
      text: initialAuthor || '',
      x: 50,
      y: 57.5,
      fontSize: 95,
      fontFamily: 'YFJLXS, sans-serif',
      color: '#ffffff',
    },
    avatar: {
      src: initialAvatar || '',
      x: 50,
      y: 75,
      size: 120,
    },
  });

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<'title' | 'subtitle' | 'author' | 'avatar' | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0, elementX: 0, elementY: 0 });
  
  // 下拉菜单状态
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // 画布容器引用
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const photosGridRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);

  // 可视区域变化时更新缩放
  const [scale, setScale] = useState(1);
  const updateScale = useCallback(() => {
    if (canvasContainerRef.current) {
      const container = canvasContainerRef.current;
      const scaleX = container.clientWidth / CANVAS_WIDTH;
      const scaleY = container.clientHeight / CANVAS_HEIGHT;
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);
      scaleRef.current = newScale;
    }
  }, []);
  
  // 使用 ResizeObserver 监听容器尺寸变化
  useEffect(() => {
    updateScale();
    
    // 窗口 resize 监听
    window.addEventListener('resize', updateScale);
    
    // ResizeObserver 监听容器尺寸变化
    let resizeObserver: ResizeObserver | null = null;
    if (canvasContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateScale();
      });
      resizeObserver.observe(canvasContainerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', updateScale);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [updateScale]);
  
  // 当模态框打开时重新计算缩放
  useEffect(() => {
    if (isOpen) {
      // 使用 requestAnimationFrame 确保 DOM 渲染完成后更新
      requestAnimationFrame(updateScale);
    }
  }, [isOpen, updateScale]);
  
  // 当图片加载完成时重新计算缩放
  useEffect(() => {
    if (imageLoaded) {
      // 使用 requestAnimationFrame 确保图片渲染完成后更新
      requestAnimationFrame(updateScale);
    }
  }, [imageLoaded, updateScale]);

  // ---------- 图片搜索与加载 ----------
  const searchPhotos = useCallback(async () => {
    setLoadingPhotos(true);
    setCurrentPage(1);
    setPlatformPhotos([]);
    try {
      const params = new URLSearchParams({
        platform: imageSource,
        page_size: String(perPage),
        page: '1',
        ...(searchQuery.trim() && { query: searchQuery }),
      });
      const res = await fetch(`${IMAGE_API_URL}/?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const photos = data.results || [];
      setPlatformPhotos(photos);
      setHasMore(photos.length >= perPage);
      if (photos.length > 0) {
        setSelectedPhoto(photos[0]);
        setImageUrl(photos[0].url || '');
        setImageLoaded(true);
      } else {
        addToast({ title: '没有找到相关图片', color: 'warning' });
      }
    } catch (error) {
      console.error('搜索图片失败:', error);
      addToast({ title: '搜索图片失败', color: 'danger' });
    } finally {
      setLoadingPhotos(false);
    }
  }, [imageSource, searchQuery, perPage]);

  // 显示的图片列表（分页）
  const displayedPhotos = useMemo(
    () => platformPhotos.slice(0, currentPage * perPage),
    [platformPhotos, currentPage, perPage]
  );

  // ---------- 初始化与副作用 ----------
  // 打开/关闭响应 isOpen
  useEffect(() => {
    if (isOpen) {
      // 同步 props 到 state，确保每次打开时都使用最新的初始值
      setTextElements(prev => ({
        ...prev,
        title: { ...prev.title, text: initialTitle || '' },
        author: { ...prev.author, text: initialAuthor || '' },
        avatar: {
          ...prev.avatar,
          src: (() => {
            if (!initialAvatar) return '';
            let avatarSrc = initialAvatar;
            if (process.env.NODE_ENV === 'development') {
              const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
              const backendBase = apiBase.replace(/\/api\/v\d+$/, '');
              if (avatarSrc.startsWith(backendBase)) {
                avatarSrc = avatarSrc.replace(backendBase, '');
              }
            }
            return avatarSrc;
          })()
        },
      }));
      // 首次打开时自动搜索
      if (imageSource !== 'upload' && platformPhotos.length === 0) {
        searchPhotos();
      }
    }
  }, [isOpen, initialTitle, initialAuthor, initialAvatar, imageSource, platformPhotos.length, searchPhotos]);

  // 图片源切换时重新搜索
  useEffect(() => {
    if (imageSource !== 'upload' && isOpen) {
      searchPhotos();
    }
  }, [imageSource, isOpen, searchPhotos]);

  const loadMorePhotos = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    try {
      const params = new URLSearchParams({
        platform: imageSource,
        page_size: String(perPage),
        page: String(nextPage),
        ...(searchQuery.trim() && { query: searchQuery }),
      });
      const res = await fetch(`${IMAGE_API_URL}/?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const photos = data.results || [];
      if (photos.length > 0) {
        setPlatformPhotos(prev => [...prev, ...photos]);
        setCurrentPage(nextPage);
        setHasMore(photos.length >= perPage);
      }
    } catch (error) {
      console.error('加载更多图片失败:', error);
      addToast({ title: '加载更多图片失败', color: 'danger' });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, currentPage, imageSource, searchQuery, perPage]);

  // 滚动加载监听
  useEffect(() => {
    const grid = photosGridRef.current;
    if (!grid) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = grid;
      if (scrollTop + clientHeight >= scrollHeight - 100 && hasMore && !loadingMore && !loadingPhotos) {
        loadMorePhotos();
      }
    };
    grid.addEventListener('scroll', handleScroll, { passive: true });
    return () => grid.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, loadingPhotos, loadMorePhotos, platformPhotos]);

  // 清理 blob URL
  useEffect(() => {
    return () => {
      if (textElements.avatar.src && textElements.avatar.src.startsWith('blob:')) {
        URL.revokeObjectURL(textElements.avatar.src);
      }
    };
  }, [textElements.avatar.src]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    
    if (exportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [exportMenuOpen]);

  const selectPhoto = (photo: PlatformPhoto) => {
    setSelectedPhoto(photo);
    setImageUrl(photo.url || '');
    setImageLoaded(true);
  };

  // ---------- 上传处理 ----------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setImageUrl(ev.target?.result as string);
      setImageLoaded(true);
      setSelectedPhoto(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setTextElements(prev => {
        // 释放旧的 blob URL
        if (prev.avatar.src && prev.avatar.src.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(prev.avatar.src);
          } catch (error) {
            console.error('释放 blob URL 失败:', error);
          }
        }
        return {
          ...prev,
          avatar: { ...prev.avatar, src: ev.target?.result as string },
        };
      });
    };
    reader.readAsDataURL(file);
  };

  // ---------- 拖拽逻辑 ----------
  const startDrag = (element: 'title' | 'subtitle' | 'author' | 'avatar', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragTarget(element);
    const el = textElements[element];
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      elementX: el.x,
      elementY: el.y,
    };
  };

  const onDrag = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragTarget) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      // 转换为百分比，使用 ref 中的最新 scale 值
      const currentScale = scaleRef.current;
      const dxPercent = (dx / (CANVAS_WIDTH * currentScale)) * 100;
      const dyPercent = (dy / (CANVAS_HEIGHT * currentScale)) * 100;

      setTextElements(prev => {
        const element = prev[dragTarget];
        const gridSize = 2.5;
        let newX = dragStartRef.current.elementX + dxPercent;
        let newY = dragStartRef.current.elementY + dyPercent;
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
        return {
          ...prev,
          [dragTarget]: {
            ...element,
            x: clamp(newX, 0, 100),
            y: clamp(newY, 0, 100),
          },
        };
      });
    },
    [isDragging, dragTarget]
  );

  const stopDrag = useCallback(() => {
    setIsDragging(false);
    setDragTarget(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', stopDrag);
    }
    return () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', stopDrag);
    };
  }, [isDragging, onDrag, stopDrag]);

  // ---------- 元素样式计算 ----------
  const getTitleStyle = (): React.CSSProperties => ({
    position: 'absolute',
    left: `${textElements.title.x}%`,
    top: `${textElements.title.y}%`,
    fontSize: textElements.title.fontSize,
    fontFamily: textElements.title.fontFamily,
    color: textElements.title.color,
    cursor: 'move',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
  });

  const getSubtitleStyle = (): React.CSSProperties => ({
    position: 'absolute',
    left: `${textElements.subtitle.x}%`,
    top: `${textElements.subtitle.y}%`,
    fontSize: textElements.subtitle.fontSize,
    fontFamily: textElements.subtitle.fontFamily,
    color: textElements.subtitle.color,
    cursor: 'move',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
  });

  const getAuthorStyle = (): React.CSSProperties => ({
    position: 'absolute',
    left: `${textElements.author.x}%`,
    top: `${textElements.author.y}%`,
    fontSize: textElements.author.fontSize,
    fontFamily: textElements.author.fontFamily,
    color: textElements.author.color,
    cursor: 'move',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
  });

  const getAvatarStyle = (): React.CSSProperties => ({
    position: 'absolute',
    left: `${textElements.avatar.x}%`,
    top: `${textElements.avatar.y}%`,
    width: textElements.avatar.size,
    height: textElements.avatar.size,
    cursor: 'move',
    transform: 'translate(-50%, -50%)',
  });

  const getAvatarImageStyle = (): React.CSSProperties => ({
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%',
    border: '4px solid #ffffff',
  });

  // ---------- 导出功能 ----------
  const generateImage = useCallback(async (): Promise<string | null> => {
    if (!canvasRef.current || !imageLoaded) {
      addToast({ title: '请先选择图片', color: 'warning' });
      return null;
    }

    try {
      // 创建临时画布用于绘制
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = CANVAS_WIDTH;
      tempCanvas.height = CANVAS_HEIGHT;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error('无法创建 Canvas 上下文');

      // 绘制背景图（cover 裁剪）
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageUrl;
      });

      const imgAspect = img.width / img.height;
      const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;
      let drawWidth, drawHeight, drawX, drawY;
      if (imgAspect > canvasAspect) {
        drawHeight = CANVAS_HEIGHT;
        drawWidth = drawHeight * imgAspect;
        drawX = (CANVAS_WIDTH - drawWidth) / 2;
        drawY = 0;
      } else {
        drawWidth = CANVAS_WIDTH;
        drawHeight = drawWidth / imgAspect;
        drawX = 0;
        drawY = (CANVAS_HEIGHT - drawHeight) / 2;
      }
      tempCtx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // 遮罩层
      tempCtx.fillStyle = `rgba(31, 41, 55, ${overlayOpacity / 100})`;
      tempCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      tempCtx.textAlign = 'center';
      tempCtx.textBaseline = 'middle';

      // 绘制文字
      if (textElements.title.text) {
        tempCtx.font = `${textElements.title.fontSize}px 'YFJLXS', Arial`;
        tempCtx.fillStyle = textElements.title.color;
        const titleX = (textElements.title.x / 100) * CANVAS_WIDTH;
        const titleY = (textElements.title.y / 100) * CANVAS_HEIGHT;
        tempCtx.fillText(textElements.title.text, titleX, titleY);
      }

      if (textElements.subtitle.text) {
        tempCtx.font = `${textElements.subtitle.fontSize}px 'YFJLXS', Arial`;
        tempCtx.fillStyle = textElements.subtitle.color;
        const subtitleX = (textElements.subtitle.x / 100) * CANVAS_WIDTH;
        const subtitleY = (textElements.subtitle.y / 100) * CANVAS_HEIGHT;
        tempCtx.fillText(textElements.subtitle.text, subtitleX, subtitleY);
      }

      if (textElements.author.text) {
        tempCtx.font = `${textElements.author.fontSize}px 'YFJLXS', Arial`;
        tempCtx.fillStyle = textElements.author.color;
        const authorX = (textElements.author.x / 100) * CANVAS_WIDTH;
        const authorY = (textElements.author.y / 100) * CANVAS_HEIGHT;
        tempCtx.fillText(textElements.author.text, authorX, authorY);
      }

      // 绘制头像
      if (textElements.avatar.src) {
        const avatarImg = new window.Image();
        avatarImg.crossOrigin = 'anonymous';
        await new Promise<void>(resolve => {
          avatarImg.onload = () => resolve();
          avatarImg.onerror = () => resolve(); // 忽略错误
          avatarImg.src = textElements.avatar.src;
        });
        if (avatarImg.complete && avatarImg.naturalWidth > 0) {
          const avatarX = (textElements.avatar.x / 100) * CANVAS_WIDTH;
          const avatarY = (textElements.avatar.y / 100) * CANVAS_HEIGHT;
          const avatarRadius = textElements.avatar.size / 2;

          tempCtx.save();
          tempCtx.beginPath();
          tempCtx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
          tempCtx.closePath();
          tempCtx.clip();
          tempCtx.drawImage(
            avatarImg,
            avatarX - avatarRadius,
            avatarY - avatarRadius,
            avatarRadius * 2,
            avatarRadius * 2
          );
          tempCtx.restore();

          tempCtx.beginPath();
          tempCtx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
          tempCtx.strokeStyle = '#ffffff';
          tempCtx.lineWidth = 2;
          tempCtx.stroke();
        }
      }

      // 创建导出画布，使用 1200×675 尺寸
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = EXPORT_WIDTH;
      exportCanvas.height = EXPORT_HEIGHT;
      const exportCtx = exportCanvas.getContext('2d');
      if (!exportCtx) throw new Error('无法创建导出 Canvas 上下文');

      // 将临时画布内容绘制到导出画布（缩放）
      exportCtx.drawImage(tempCanvas, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

      // 使用 WebP 格式导出，质量 0.8
      return exportCanvas.toDataURL('image/webp', 0.8);
    } catch (error) {
      console.error('生成图片失败:', error);
      addToast({ title: '生成图片失败', color: 'danger' });
      return null;
    }
  }, [imageUrl, imageLoaded, overlayOpacity, textElements]);

  const handleExport = async (command: 'apply' | 'apply-export' | 'export-only') => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    if (command === 'apply' || command === 'apply-export') {
      onSave(dataUrl);
      onClose();
      addToast({ title: '封面已应用到文章', color: 'success' });
    }

    if (command === 'apply-export' || command === 'export-only') {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `cover-${Date.now()}.webp`;
      link.click();
      addToast({ title: '图片已导出', color: 'success' });
    }
  };

  // ---------- 关闭处理 ----------
  const handleClose = () => {
    onClose();
  };

  // 如果不可见，渲染空
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[3000] p-2 sm:p-5" onClick={handleClose}>
      <div className="w-full h-full max-w-[1400px] max-h-[90vh] bg-white rounded-xl flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <header className="flex items-center justify-between px-6 py-5 flex-shrink-0">
          <span className="text-lg font-medium">制作封面</span>
          <div className="flex items-center gap-3">
            <div className="flex gap-1" ref={exportMenuRef}>
              <button
                onClick={() => handleExport('apply')}
                className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-l-md hover:bg-blue-600 transition"
              >
                应用
              </button>
              <div className="relative">
                <button 
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  onTouchStart={() => setExportMenuOpen(!exportMenuOpen)}
                  className="px-2 py-1.5 bg-blue-500 text-white text-sm rounded-r-md hover:bg-blue-600 transition border-l border-blue-400"
                >
                  ▼
                </button>
                <div className={`absolute right-0 top-full mt-1 bg-white shadow-lg rounded-md z-50 ${exportMenuOpen ? 'block' : 'hidden'}`}>
                  <button
                    onClick={() => {
                      handleExport('apply-export');
                      setExportMenuOpen(false);
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleExport('apply-export');
                      setExportMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 whitespace-nowrap"
                  >
                    应用并导出
                  </button>
                  <button
                    onClick={() => {
                      handleExport('export-only');
                      setExportMenuOpen(false);
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleExport('export-only');
                      setExportMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 whitespace-nowrap"
                  >
                    仅导出
                  </button>
                </div>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 transition">
              <X size={18} />
            </button>
          </div>
        </header>

        {/* 主体 */}
        <main className="flex-1 flex flex-col md:flex-row bg-gray-100 min-h-0">
          {/* 左侧工具栏 */}
          <aside className="w-[300px] bg-white border-r border-gray-200 flex flex-col h-full md:h-auto max-md:w-full max-md:max-h-[30vh] max-md:border-r-0 max-md:border-b overflow-hidden">
            <div className="p-2">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
                {(['unsplash', 'pixabay', 'pexels', 'upload'] as const).map(src => (
                  <button
                    key={src}
                    onClick={() => setImageSource(src)}
                    className={`flex-1 py-1 text-xs rounded-md transition ${imageSource === src ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                  >
                    {src === 'upload' ? '上传' : src.charAt(0).toUpperCase() + src.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              {imageSource !== 'upload' ? (
                <div
                  ref={photosGridRef}
                  className="flex-1 overflow-y-auto px-3 mx-1.5"
                >
                  {loadingPhotos ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                      <Loader2 className="animate-spin mb-2" size={24} />
                      <span className="text-sm">加载中...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {displayedPhotos.map(photo => (
                        <div
                          key={photo.id}
                          className={`relative aspect-[16/10] rounded-md overflow-hidden cursor-pointer transition hover:scale-105 hover:shadow-lg ${selectedPhoto?.id === photo.id ? 'ring-2 ring-blue-500 shadow-[0_0_0_4px_rgba(64,158,255,0.2)]' : ''}`}
                          onClick={() => selectPhoto(photo)}
                        >
                          <Image src={photo.thumbnail} alt="" width={300} height={180} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  )}
                  {loadingMore && (
                    <div className="py-4 text-center text-gray-400 flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      <span className="text-xs">加载更多...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition w-full">
                    <Plus size={32} className="mx-auto text-gray-400 mb-2" />
                    <span className="block text-sm text-gray-500">点击或拖拽上传</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {imageSource !== 'upload' && (
              <div className="p-3 flex gap-2 border-t border-gray-100">
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchPhotos()}
                  placeholder="搜索图片..."
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                />
                <button onClick={searchPhotos} className="p-2 bg-gray-100 rounded-md hover:bg-gray-200">
                  <Search size={18} />
                </button>
              </div>
            )}
          </aside>

          {/* 中间画布 */}
          <section className="flex-1 flex items-center justify-center p-4 md:p-8 min-h-[300px] md:min-h-0">
            <div ref={canvasContainerRef} className="w-full aspect-video bg-gray-100 rounded-lg relative overflow-hidden max-w-full">
              {!imageLoaded ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon size={64} className="mb-4" />
                  <p>上传图片开始创作</p>
                </div>
              ) : (
                <div
                  ref={canvasRef}
                  className="absolute top-1/2 left-1/2"
                  style={{
                    width: CANVAS_WIDTH,
                    height: CANVAS_HEIGHT,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    transformOrigin: 'center center',
                  }}
                >
                  <Image 
                    src={imageUrl} 
                    alt="" 
                    width={CANVAS_WIDTH} 
                    height={CANVAS_HEIGHT} 
                    className="w-full h-full object-cover block rounded"
                    priority
                    unoptimized={imageUrl.startsWith('data:')}
                  />
                  <div
                    className="absolute inset-0 bg-gray-800 pointer-events-none"
                    style={{ opacity: overlayOpacity / 100 }}
                  ></div>
                  {isDragging && (
                    <div className="absolute inset-0 pointer-events-none z-10">
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50 transform -translate-x-1/2"></div>
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-white/50 transform -translate-y-1/2"></div>
                    </div>
                  )}
                  {textElements.subtitle.text && (
                    <div
                      className="subtitle-element absolute cursor-move hover:border-blue-300/30 hover:bg-white/10 border-2 border-transparent rounded px-4 py-2 z-10"
                      style={getSubtitleStyle()}
                      onMouseDown={e => startDrag('subtitle', e)}
                    >
                      {textElements.subtitle.text}
                    </div>
                  )}
                  {textElements.title.text && (
                    <div
                      className="title-element absolute cursor-move hover:border-blue-300/30 hover:bg-white/10 border-2 border-transparent rounded px-4 py-2 z-10"
                      style={getTitleStyle()}
                      onMouseDown={e => startDrag('title', e)}
                    >
                      {textElements.title.text}
                    </div>
                  )}
                  {textElements.author.text && (
                    <div
                      className="author-element absolute cursor-move hover:border-blue-300/30 hover:bg-white/10 border-2 border-transparent rounded px-4 py-2 z-10"
                      style={getAuthorStyle()}
                      onMouseDown={e => startDrag('author', e)}
                    >
                      {textElements.author.text}
                    </div>
                  )}
                  {textElements.avatar.src && (
                    <div
                      className="avatar-element absolute cursor-move rounded-full overflow-hidden border-3 border-transparent hover:border-blue-300/50 hover:scale-105 z-10"
                      style={getAvatarStyle()}
                      onMouseDown={e => startDrag('avatar', e)}
                    >
                      <Image 
                        src={textElements.avatar.src} 
                        alt="Author avatar"
                        width={textElements.avatar.size} 
                        height={textElements.avatar.size}
                        style={getAvatarImageStyle()}
                        unoptimized={textElements.avatar.src.startsWith('data:')}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* 右侧属性面板 */}
          <aside className="w-[320px] bg-white border-l border-gray-200 p-4 md:p-6 flex flex-col gap-4 max-md:w-full max-md:max-h-[30vh] max-md:border-l-0 max-md:border-t max-md:overflow-y-auto">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-700 mb-2">
                遮罩层浓度
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={overlayOpacity}
                  onChange={e => setOverlayOpacity(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-11 text-right text-gray-500">{overlayOpacity}%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-700 mb-2">标题</label>
              <input
                value={textElements.title.text}
                onChange={e =>
                  setTextElements(prev => ({
                    ...prev,
                    title: { ...prev.title, text: e.target.value },
                  }))
                }
                placeholder="请输入标题"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-700 mb-2">副标题</label>
              <input
                value={textElements.subtitle.text}
                onChange={e =>
                  setTextElements(prev => ({
                    ...prev,
                    subtitle: { ...prev.subtitle, text: e.target.value },
                  }))
                }
                placeholder="请输入副标题"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-700 mb-2">作者</label>
              <input
                value={textElements.author.text}
                onChange={e =>
                  setTextElements(prev => ({
                    ...prev,
                    author: { ...prev.author, text: e.target.value },
                  }))
                }
                placeholder="请输入作者名称"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-700 mb-2">头像</label>
              <label className="inline-block px-4 py-1.5 bg-blue-500 text-white text-sm rounded-md cursor-pointer hover:bg-blue-600 transition">
                选择图片
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
