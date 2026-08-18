"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Image as ImageIcon, User, Layout, Eye } from "lucide-react";

interface UploadAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    assetId: string;
    assetType: "character" | "scene" | "prop";
    assetName: string;
    defaultDescription: string;
    scriptId: string;
    onUploadComplete: (updatedScript: any) => void;
}

export default function UploadAssetModal({
    isOpen,
    onClose,
    assetId,
    assetType,
    assetName,
    defaultDescription,
    scriptId,
    onUploadComplete,
}: UploadAssetModalProps) {
    const t = useTranslations("assets");
    const tc = useTranslations("common");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadType, setUploadType] = useState<string>(
        assetType === "character" ? "full_body" : "image"
    );
    const [description, setDescription] = useState(defaultDescription);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadTypes = assetType === "character" ? [
        { id: "full_body", label: t("fullBody"), icon: User, description: t("fullBodyDesc") },
        { id: "head_shot", label: t("headShot"), icon: Eye, description: t("headShotDesc") },
        { id: "three_views", label: t("threeViews"), icon: Layout, description: t("threeViewsDesc") },
    ] : assetType === "scene" ? [
        { id: "image", label: t("sceneImage"), icon: ImageIcon, description: t("sceneImageDesc") },
    ] : [
        { id: "image", label: t("propImage"), icon: ImageIcon, description: t("propImageDesc") },
    ];

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith("image/")) {
                setError(t("errorNotImage"));
                return;
            }
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError(t("errorTooLarge"));
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setError(null);
        }
    }, [t]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setError(null);
        }
    }, []);

    const handleUpload = async () => {
        if (!selectedFile) {
            setError(t("errorNoFile"));
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            // Use api.uploadAsset which uses the correct backend API URL
            const { api } = await import("@/lib/api");
            const updatedScript = await api.uploadAsset(
                scriptId,
                assetType,
                assetId,
                selectedFile,
                uploadType,
                description
            );
            onUploadComplete(updatedScript);
            handleClose();
        } catch (err: any) {
            setError(err.message || t("errorUploadFailed"));
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setError(null);
        setDescription(defaultDescription);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-elevated rounded-xl p-6 w-full max-w-lg mx-4 shadow-lg border border-glass-border"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-foreground">
                            {t("uploadTitle", { name: assetName })}
                        </h2>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-hover-bg rounded-lg transition-colors"
                        >
                            <X size={20} className="text-text-secondary" />
                        </button>
                    </div>

                    {/* Upload Type Selector (only for Character) */}
                    {assetType === "character" && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-text-secondary mb-3">
                                {t("selectAssetType")}
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {uploadTypes.map((type) => {
                                    const Icon = type.icon;
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => setUploadType(type.id)}
                                            className={`p-4 rounded-lg border-2 transition-all ${uploadType === type.id
                                                ? "border-primary bg-primary/10"
                                                : "border-glass-border hover:border-glass-border"
                                                }`}
                                        >
                                            <Icon
                                                size={24}
                                                className={`mx-auto mb-2 ${uploadType === type.id ? "text-primary" : "text-text-secondary"
                                                    }`}
                                            />
                                            <div className="text-sm font-medium text-foreground">{type.label}</div>
                                            <div className="text-xs text-text-muted mt-1">{type.description}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* File Upload Area */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-text-secondary mb-3">
                            {t("selectImage")}
                        </label>
                        <div
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${previewUrl
                                ? "border-primary bg-primary/5"
                                : "border-glass-border hover:border-primary/50"
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            {previewUrl ? (
                                <div className="relative">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="max-h-48 mx-auto rounded-lg object-contain"
                                    />
                                    <div className="mt-3 text-sm text-text-secondary">
                                        {t("clickToChange")}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Upload size={32} className="mx-auto text-text-muted mb-3" />
                                    <div className="text-text-secondary">{t("dragImageHint")}</div>
                                    <div className="text-xs text-text-muted mt-2">
                                        {t("formatHint")}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Description Editor */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            {t("assetDescription")} <span className="text-xs text-text-muted">{t("forGeneration")}</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-glass border border-glass-border rounded-lg px-3 py-2 text-foreground text-sm resize-none focus:outline-none focus:border-primary/50"
                            placeholder={t("descriptionPlaceholder")}
                        />
                        <div className="text-xs text-text-muted mt-1">
                            {t("descriptionNote")}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 bg-glass hover:bg-hover-bg text-foreground rounded-lg transition-colors"
                        >
                            {tc("cancel")}
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!selectedFile || isUploading}
                            className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-foreground/30 border-t-white rounded-full animate-spin" />
                                    {t("uploading")}
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    {t("confirmUpload")}
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
