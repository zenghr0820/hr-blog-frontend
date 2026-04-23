"use client";

import { useState, useCallback, useRef } from "react";
import {
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Switch,
  Select,
  SelectItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  addToast,
} from "@heroui/react";
import { MessageSquare, Pencil, Link2, Video, Music, X, MapPin, Tag, ImagePlus, Upload } from "lucide-react";
import { AdminDialog } from "@/components/admin/AdminDialog";
import { useCreateEssay, useUpdateEssay } from "@/hooks/queries/use-essays";
import { toolsApi } from "@/lib/api/tools";
import { postManagementApi } from "@/lib/api/post-management";
import {
  MUSIC_SERVER_LABELS,
  MUSIC_TYPE_LABELS,
  VIDEO_PLATFORM_LABELS,
  getVideoIframeSrc,
} from "@/types/essay";
import type { EssayItem, EssayContent, EssayMusic, EssayVideo } from "@/types/essay";

const MUSIC_SERVERS = Object.entries(MUSIC_SERVER_LABELS).map(([key, label]) => ({ key, label }));
const MUSIC_TYPES = Object.entries(MUSIC_TYPE_LABELS).map(([key, label]) => ({ key, label }));

interface ImageItem {
  id: string;
  url: string;
  uploading?: boolean;
}

interface EssayFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: EssayItem | null;
}

export default function EssayFormModal({ isOpen, onClose, editItem }: EssayFormModalProps) {
  const isEdit = !!editItem;

  return (
    <AdminDialog
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      header={{
        title: isEdit ? "编辑说说" : "新增说说",
        description: isEdit ? "修改说说内容和发布状态" : "发布一条新的说说动态",
        icon: isEdit ? Pencil : MessageSquare,
      }}
    >
      {isOpen && <EssayFormContent editItem={editItem} onClose={onClose} />}
    </AdminDialog>
  );
}

function EssayFormContent({ editItem, onClose }: { editItem?: EssayItem | null; onClose: () => void }) {
  const isEdit = !!editItem;

  const [text, setText] = useState(editItem?.content?.text ?? "");
  const [location, setLocation] = useState(editItem?.content?.location ?? "");
  const [tags, setTags] = useState(editItem?.content?.tags ?? "");

  const [imageItems, setImageItems] = useState<ImageItem[]>(
    editItem?.content?.images?.map((url, i) => ({ id: `edit-${i}`, url })) ?? []
  );
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [linkUrl, setLinkUrl] = useState(editItem?.content?.link?.url ?? "");
  const [linkTitle, setLinkTitle] = useState(editItem?.content?.link?.title ?? "");
  const [linkFavicon, setLinkFavicon] = useState(editItem?.content?.link?.favicon ?? "");
  const [fetchingLink, setFetchingLink] = useState(false);

  const [musicServer, setMusicServer] = useState<string>(editItem?.content?.music?.server ?? "netease");
  const [musicType, setMusicType] = useState<string>(editItem?.content?.music?.type ?? "song");
  const [musicId, setMusicId] = useState(editItem?.content?.music?.id ?? "");
  const [musicUrl, setMusicUrl] = useState(editItem?.content?.music?.url ?? "");
  const [musicTitle, setMusicTitle] = useState(editItem?.content?.music?.title ?? "");
  const [musicAuthor, setMusicAuthor] = useState(editItem?.content?.music?.author ?? "");
  const [musicCover, setMusicCover] = useState(editItem?.content?.music?.cover ?? "");
  const [fetchingMusic, setFetchingMusic] = useState(false);

  const [videoUrl, setVideoUrl] = useState(editItem?.content?.video?.url ?? "");
  const [videoPlatform, setVideoPlatform] = useState(editItem?.content?.video?.platform ?? "");
  const [videoId, setVideoId] = useState(editItem?.content?.video?.video_id ?? "");
  const [fetchingVideo, setFetchingVideo] = useState(false);

  const [isPublish, setIsPublish] = useState(editItem?.is_publish ?? true);

  const [imagePopoverOpen, setImagePopoverOpen] = useState(false);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [musicPopoverOpen, setMusicPopoverOpen] = useState(false);
  const [videoPopoverOpen, setVideoPopoverOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const createEssay = useCreateEssay();
  const updateEssay = useUpdateEssay();

  const hasImages = imageItems.length > 0;
  const hasLink = !!linkUrl.trim();
  const hasMusic = !!musicId.trim() || !!musicUrl.trim();
  const hasVideo = !!videoUrl.trim();

  const addImageUrl = useCallback(() => {
    const url = imageUrlInput.trim();
    if (!url) return;
    setImageItems(prev => [...prev, { id: `url-${Date.now()}`, url }]);
    setImageUrlInput("");
  }, [imageUrlInput]);

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const newItems: ImageItem[] = Array.from(files).map(file => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: URL.createObjectURL(file),
      uploading: true,
    }));

    setImageItems(prev => [...prev, ...newItems]);

    for (let i = 0; i < files.length; i++) {
      try {
        const remoteUrl = await postManagementApi.uploadArticleImage(files[i]);
        setImageItems(prev =>
          prev.map(item => item.id === newItems[i].id ? { ...item, url: remoteUrl, uploading: false } : item)
        );
      } catch {
        setImageItems(prev => prev.map(item =>
          item.id === newItems[i].id ? { ...item, uploading: false } : item
        ));
        addToast({ title: `图片 ${files[i].name} 上传失败`, color: "danger", timeout: 3000 });
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removeImage = useCallback((id: string) => {
    setImageItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleParseLink = useCallback(async () => {
    if (!linkUrl.trim()) {
      addToast({ title: "请先输入链接URL", color: "warning", timeout: 2000 });
      return;
    }
    setFetchingLink(true);
    try {
      const metadata = await toolsApi.fetchLinkMetadata(linkUrl.trim());
      if (metadata.title) setLinkTitle(metadata.title);
      if (metadata.favicon) setLinkFavicon(metadata.favicon);
      addToast({ title: "链接解析成功", color: "success", timeout: 2000 });
    } catch (error) {
      addToast({
        title: error instanceof Error ? error.message : "链接解析失败",
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setFetchingLink(false);
    }
  }, [linkUrl]);

  const handleParseVideo = useCallback(async () => {
    if (!videoUrl.trim()) {
      addToast({ title: "请先输入视频链接", color: "warning", timeout: 2000 });
      return;
    }
    setFetchingVideo(true);
    try {
      const result = await toolsApi.parseVideo(videoUrl.trim());
      setVideoPlatform(result.platform);
      setVideoId(result.video_id);
      if (result.platform) {
        const platformName = VIDEO_PLATFORM_LABELS[result.platform] || result.platform;
        addToast({ title: `已识别：${platformName} - ${result.video_id}`, color: "success", timeout: 2000 });
      } else {
        addToast({ title: "已识别为直链视频", color: "success", timeout: 2000 });
      }
    } catch (error) {
      addToast({
        title: error instanceof Error ? error.message : "无法识别的视频链接（支持B站、YouTube）",
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setFetchingVideo(false);
    }
  }, [videoUrl]);

  const handleParseMusic = useCallback(async () => {
    if (!musicId.trim()) {
      addToast({ title: "请先输入音乐ID", color: "warning", timeout: 2000 });
      return;
    }
    setFetchingMusic(true);
    try {
      const result = await toolsApi.parseMusic(musicServer, musicType, musicId.trim());
      if (result.title) setMusicTitle(result.title);
      if (result.author) setMusicAuthor(result.author);
      if (result.pic) setMusicCover(result.pic);
      if (result.url) setMusicUrl(result.url);
      const serverLabel = MUSIC_SERVERS.find(s => s.key === musicServer)?.label || musicServer;
      addToast({ title: `已解析：${serverLabel} - ${result.title || musicId}`, color: "success", timeout: 2000 });
    } catch (error) {
      addToast({
        title: error instanceof Error ? error.message : "音乐解析失败",
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setFetchingMusic(false);
    }
  }, [musicServer, musicType, musicId]);

  const removeLink = useCallback(() => {
    setLinkUrl("");
    setLinkTitle("");
    setLinkFavicon("");
  }, []);

  const removeMusic = useCallback(() => {
    setMusicServer("netease");
    setMusicType("song");
    setMusicId("");
    setMusicUrl("");
    setMusicTitle("");
    setMusicAuthor("");
    setMusicCover("");
  }, []);

  const removeVideo = useCallback(() => {
    setVideoUrl("");
    setVideoPlatform("");
    setVideoId("");
  }, []);

  const handleSubmit = useCallback(async () => {
    const imageUrls = imageItems.filter(item => !item.uploading).map(item => item.url);
    if (!text.trim() && imageUrls.length === 0) {
      addToast({ title: "请输入说说内容或添加图片", color: "warning", timeout: 3000 });
      return;
    }

    const content: EssayContent = {};
    if (text.trim()) content.text = text.trim();
    if (imageUrls.length > 0) content.images = imageUrls;
    if (location.trim()) content.location = location.trim();
    if (tags.trim()) content.tags = tags.trim();

    if (linkUrl.trim()) {
      content.link = {
        url: linkUrl.trim(),
        title: linkTitle.trim() || undefined,
        favicon: linkFavicon.trim() || undefined,
      };
    }

    if (musicId.trim()) {
      const music: EssayMusic = {
        server: musicServer as EssayMusic["server"],
        type: musicType as EssayMusic["type"],
        id: musicId.trim(),
      };
      if (musicUrl.trim()) music.url = musicUrl.trim();
      if (musicTitle.trim()) music.title = musicTitle.trim();
      if (musicAuthor.trim()) music.author = musicAuthor.trim();
      if (musicCover.trim()) music.cover = musicCover.trim();
      content.music = music;
    } else if (musicUrl.trim()) {
      content.music = {
        url: musicUrl.trim(),
        title: musicTitle.trim() || undefined,
        author: musicAuthor.trim() || undefined,
        cover: musicCover.trim() || undefined,
      };
    }

    if (videoUrl.trim()) {
      const video: EssayVideo = { url: videoUrl.trim() };
      if (videoPlatform) video.platform = videoPlatform as EssayVideo["platform"];
      if (videoId) video.video_id = videoId;
      content.video = video;
    }

    const formData = {
      content,
      is_publish: isPublish,
    };

    try {
      if (isEdit && editItem) {
        await updateEssay.mutateAsync({ id: editItem.id, data: formData });
        addToast({ title: "更新成功", color: "success", timeout: 2000 });
      } else {
        await createEssay.mutateAsync(formData);
        addToast({ title: "创建成功", color: "success", timeout: 2000 });
      }
      onClose();
    } catch (error) {
      addToast({
        title: error instanceof Error ? error.message : "操作失败",
        color: "danger",
        timeout: 3000,
      });
    }
  }, [
    text, imageItems, location, tags,
    linkUrl, linkTitle, linkFavicon,
    musicServer, musicType, musicId, musicUrl, musicTitle, musicAuthor, musicCover,
    videoUrl, videoPlatform, videoId,
    isPublish, isEdit, editItem, createEssay, updateEssay, onClose,
  ]);

  const isSubmitting = createEssay.isPending || updateEssay.isPending;

  const popoverClassNames = {
    content: "p-4 bg-content1 border border-border rounded-xl shadow-lg w-[340px]",
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <ModalBody className="gap-4">
        <Textarea
          label="说说内容"
          placeholder="此刻的想法..."
          value={text}
          onValueChange={setText}
          minRows={3}
          maxRows={8}
          maxLength={2000}
        />

        <div className="flex items-center gap-3 flex-wrap">
          <Input
            label="位置"
            placeholder="如：北京·故宫"
            value={location}
            onValueChange={setLocation}
            maxLength={100}
            startContent={<MapPin className="w-3.5 h-3.5 text-default-400" />}
            className="flex-1 min-w-[140px]"
          />
          <Input
            label="标签"
            placeholder="如：日常,随想"
            value={tags}
            onValueChange={setTags}
            maxLength={100}
            startContent={<Tag className="w-3.5 h-3.5 text-default-400" />}
            className="flex-1 min-w-[140px]"
          />
        </div>

        <div className="flex items-center gap-2 py-2 border-t border-border/40">
          <span className="text-xs text-muted-foreground mr-1">添加：</span>

          <Popover
            placement="bottom-start"
            offset={8}
            showArrow
            isOpen={imagePopoverOpen}
            onOpenChange={setImagePopoverOpen}
            classNames={popoverClassNames}
          >
            <PopoverTrigger>
              <Button
                size="sm"
                variant={hasImages ? "solid" : "flat"}
                color={hasImages ? "primary" : "default"}
                startContent={<ImagePlus className="w-4 h-4" />}
              >
                图片{hasImages ? ` ${imageItems.length}` : ""}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="space-y-3">
                <p className="text-sm font-medium">动态配图</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="输入图片链接"
                    value={imageUrlInput}
                    onValueChange={setImageUrlInput}
                    size="sm"
                    className="flex-1"
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addImageUrl();
                      }
                    }}
                  />
                  <Button
                    color="primary"
                    size="sm"
                    onPress={addImageUrl}
                    isDisabled={!imageUrlInput.trim()}
                  >
                    添加
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="flat"
                    size="sm"
                    startContent={<Upload className="w-3.5 h-3.5" />}
                    onPress={handleImageUpload}
                    isLoading={uploadingImage}
                    className="flex-1"
                  >
                    上传图片
                  </Button>
                </div>
                {imageItems.length > 0 && (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {imageItems.map(item => (
                      <div key={item.id} className="flex items-center gap-2 p-1.5 bg-default-50 rounded">
                        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-default-100">
                          {item.uploading ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">...</span>
                            </div>
                          ) : (
                            <img
                              src={item.url}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          {item.uploading ? "上传中..." : item.url}
                        </span>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="text-default-400 hover:text-danger flex-shrink-0 min-w-6 w-6 h-6"
                          onPress={() => removeImage(item.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Popover
            placement="bottom-start"
            offset={8}
            showArrow
            isOpen={linkPopoverOpen}
            onOpenChange={setLinkPopoverOpen}
            classNames={popoverClassNames}
          >
            <PopoverTrigger>
              <Button
                size="sm"
                variant={hasLink ? "solid" : "flat"}
                color={hasLink ? "primary" : "default"}
                startContent={<Link2 className="w-4 h-4" />}
              >
                链接
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="space-y-3">
                <p className="text-sm font-medium">网站分享</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="请输入网站地址"
                    value={linkUrl}
                    onValueChange={setLinkUrl}
                    size="sm"
                    className="flex-1"
                  />
                  <Button
                    color="primary"
                    size="sm"
                    isLoading={fetchingLink}
                    onPress={handleParseLink}
                  >
                    解析
                  </Button>
                </div>
                <Input
                  placeholder="网站标题"
                  value={linkTitle}
                  onValueChange={setLinkTitle}
                  size="sm"
                />
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="网站图标URL"
                    value={linkFavicon}
                    onValueChange={setLinkFavicon}
                    size="sm"
                    className="flex-1"
                  />
                  {linkFavicon && (
                    <img
                      src={linkFavicon}
                      alt="图标"
                      className="w-8 h-8 rounded object-contain border border-border flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover
            placement="bottom-start"
            offset={8}
            showArrow
            isOpen={musicPopoverOpen}
            onOpenChange={setMusicPopoverOpen}
            classNames={popoverClassNames}
          >
            <PopoverTrigger>
              <Button
                size="sm"
                variant={hasMusic ? "solid" : "flat"}
                color={hasMusic ? "primary" : "default"}
                startContent={<Music className="w-4 h-4" />}
              >
                音乐
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="space-y-3">
                <p className="text-sm font-medium">动态音乐</p>
                <Select
                  label="音乐平台"
                  selectedKeys={new Set([musicServer])}
                  onSelectionChange={keys => {
                    const v = Array.from(keys)[0] as string;
                    if (v) setMusicServer(v);
                  }}
                  size="sm"
                >
                  {MUSIC_SERVERS.map(s => (
                    <SelectItem key={s.key}>{s.label}</SelectItem>
                  ))}
                </Select>
                <Select
                  label="类型"
                  selectedKeys={new Set([musicType])}
                  onSelectionChange={keys => {
                    const v = Array.from(keys)[0] as string;
                    if (v) setMusicType(v);
                  }}
                  size="sm"
                >
                  {MUSIC_TYPES.map(t => (
                    <SelectItem key={t.key}>{t.label}</SelectItem>
                  ))}
                </Select>
                <div className="flex gap-2">
                  <Input
                    label="音乐ID"
                    placeholder="平台歌曲ID"
                    value={musicId}
                    onValueChange={setMusicId}
                    size="sm"
                    className="flex-1"
                  />
                  <Button
                    color="primary"
                    size="sm"
                    className="mt-5"
                    isLoading={fetchingMusic}
                    onPress={handleParseMusic}
                  >
                    解析
                  </Button>
                </div>
                {musicTitle && musicId && (
                  <div className="flex items-center gap-3 p-2 bg-primary/5 rounded-lg">
                    {musicCover && (
                      <img
                        src={musicCover}
                        alt="封面"
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{musicTitle}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {musicAuthor || "未知艺术家"}
                        <span className="ml-1">
                          · {MUSIC_SERVERS.find(s => s.key === musicServer)?.label}
                          · {MUSIC_TYPES.find(t => t.key === musicType)?.label}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
                <Input
                  label="音乐URL（备选）"
                  placeholder="直接播放链接"
                  value={musicUrl}
                  onValueChange={setMusicUrl}
                  size="sm"
                  description="有音乐ID时可省略"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="歌曲名称"
                    placeholder="歌曲名称"
                    value={musicTitle}
                    onValueChange={setMusicTitle}
                    size="sm"
                  />
                  <Input
                    label="歌手"
                    placeholder="歌手名"
                    value={musicAuthor}
                    onValueChange={setMusicAuthor}
                    size="sm"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover
            placement="bottom-start"
            offset={8}
            showArrow
            isOpen={videoPopoverOpen}
            onOpenChange={setVideoPopoverOpen}
            classNames={popoverClassNames}
          >
            <PopoverTrigger>
              <Button
                size="sm"
                variant={hasVideo ? "solid" : "flat"}
                color={hasVideo ? "primary" : "default"}
                startContent={<Video className="w-4 h-4" />}
              >
                视频
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="space-y-3">
                <p className="text-sm font-medium">动态视频</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="输入视频链接"
                    value={videoUrl}
                    onValueChange={setVideoUrl}
                    size="sm"
                    className="flex-1"
                  />
                  <Button
                    color="primary"
                    size="sm"
                    isLoading={fetchingVideo}
                    onPress={handleParseVideo}
                  >
                    解析
                  </Button>
                </div>
                {videoPlatform && videoId && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg">
                    <span className="text-xs text-primary font-medium">
                      {VIDEO_PLATFORM_LABELS[videoPlatform] || videoPlatform}
                    </span>
                    <span className="text-xs text-muted-foreground">{videoId}</span>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {(hasImages || hasLink || hasMusic || hasVideo) && (
          <div className="space-y-2">
            {hasImages && (
              <div className="p-3 bg-content2 rounded-lg border border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    图片 ({imageItems.length})
                  </span>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="text-default-400 hover:text-danger"
                    onPress={() => setImageItems([])}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {imageItems.map(item => (
                    <div key={item.id} className="relative group">
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-border/50 bg-default-50">
                        {item.uploading ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-muted-foreground animate-pulse">上传中</span>
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={e => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              target.parentElement!.innerHTML = '<span class="text-xs text-muted-foreground">加载失败</span>';
                            }}
                          />
                        )}
                      </div>
                      {!item.uploading && (
                        <button
                          type="button"
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(item.id)}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasLink && (
              <div className="flex items-center gap-3 p-3 bg-content2 rounded-lg border border-border/30">
                <div className="flex-shrink-0">
                  {linkFavicon ? (
                    <img
                      src={linkFavicon}
                      alt="图标"
                      className="w-10 h-10 rounded object-contain"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-default-100 flex items-center justify-center">
                      <Link2 className="w-5 h-5 text-default-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{linkTitle || linkUrl}</p>
                  <p className="text-xs text-muted-foreground truncate">{linkUrl}</p>
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="text-default-400 hover:text-danger flex-shrink-0"
                  onPress={removeLink}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {hasMusic && (
              <div className="flex items-center gap-3 p-3 bg-content2 rounded-lg border border-border/30">
                <div className="flex-shrink-0">
                  {musicCover ? (
                    <img
                      src={musicCover}
                      alt="封面"
                      className="w-10 h-10 rounded object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-default-100 flex items-center justify-center">
                      <Music className="w-5 h-5 text-default-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {musicTitle || "未知歌曲"}
                    {musicServer && musicId && (
                      <span className="ml-2 text-xs font-normal text-primary">
                        {MUSIC_SERVERS.find(s => s.key === musicServer)?.label}
                        · {MUSIC_TYPES.find(t => t.key === musicType)?.label}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {musicAuthor || (musicServer ? `${musicServer} - ${musicType}` : "音乐")}
                  </p>
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="text-default-400 hover:text-danger flex-shrink-0"
                  onPress={removeMusic}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {hasVideo && (
              <div className="p-3 bg-content2 rounded-lg border border-border/30">
                {videoPlatform && videoId ? (
                  <div className="space-y-2">
                    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                      <iframe
                        src={getVideoIframeSrc(videoPlatform, videoId)}
                        className="absolute inset-0 w-full h-full rounded"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-primary font-medium">
                        {VIDEO_PLATFORM_LABELS[videoPlatform] || videoPlatform} · {videoId}
                      </span>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="text-default-400 hover:text-danger"
                        onPress={removeVideo}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-default-100 flex items-center justify-center flex-shrink-0">
                      <Video className="w-5 h-5 text-default-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">直链视频</p>
                      <p className="text-xs text-muted-foreground truncate">{videoUrl}</p>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      className="text-default-400 hover:text-danger flex-shrink-0"
                      onPress={removeVideo}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Switch isSelected={isPublish} onValueChange={setIsPublish}>
          {isPublish ? "发布" : "保存为草稿"}
        </Switch>
      </ModalBody>

      <ModalFooter>
        <Button variant="flat" onPress={onClose}>
          取消
        </Button>
        <Button color="primary" onPress={handleSubmit} isLoading={isSubmitting}>
          {isEdit ? "保存修改" : isPublish ? "发布说说" : "保存草稿"}
        </Button>
      </ModalFooter>
    </>
  );
}
