"use client";

import { Canvas } from "@react-three/fiber";
import { Stars, Grid } from "@react-three/drei";
import { motion } from "framer-motion";
import { Suspense, useState, useEffect, Component, type ReactNode } from "react";
import { useSettingsStore } from "@/store/settingsStore";

function Background({ isDark }: { isDark: boolean }) {
    return (
        <>
            <color attach="background" args={[isDark ? "#050508" : "#f0f1f3"]} />
            {isDark && (
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            )}
            <Grid
                infiniteGrid
                fadeDistance={50}
                sectionColor={isDark ? "#646cff" : "#b4b8ff"}
                cellColor={isDark ? "#ffffff" : "#d0d5dd"}
                sectionSize={10}
                cellSize={1}
                sectionThickness={1}
                cellThickness={0.5}
            />
            <ambientLight intensity={isDark ? 0.5 : 0.8} />
            <pointLight position={[10, 10, 10]} />
        </>
    );
}

// 同步检测 WebGL 是否可用，在首次渲染前判定。headless 浏览器或用户禁用
// 硬件加速时返回 false，此时跳过 <Canvas> 挂载，避免 WebGL 创建失败抛错拖垮整页。
function detectWebGL(): boolean {
    if (typeof document === "undefined") return true; // SSR：乐观，客户端再判
    try {
        const canvas = document.createElement("canvas");
        return !!(
            canvas.getContext("webgl2") ||
            canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl")
        );
    } catch {
        return false;
    }
}

// 兜底：即使 WebGL 初始可用，运行时 context lost 也不让整页崩溃。
// fallback 返回 null，外层 bg-background 仍保留静态主题底色。
class CanvasErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    render() {
        if (this.state.failed) return null;
        return this.props.children;
    }
}

export default function CreativeCanvas() {
    const theme = useSettingsStore((s) => s.theme);
    const isDark = theme.endsWith("-dark");
    const isAtelier = theme.startsWith("atelier");
    // 仅在客户端挂载后检测 WebGL：SSR 与首次渲染保持一致（都不挂 Canvas），
    // 避免 hydration mismatch；useEffect 跑完才按需挂载 3D 背景。
    const [canRender3D, setCanRender3D] = useState(false);
    useEffect(() => {
        setCanRender3D(detectWebGL());
    }, []);

    // Atelier 主题不需要 3D 透视网格 —— 背景由 --bg-base 纯色 + 页面级 bloom/grain 承担氛围。
    if (isAtelier) {
        return (
            <div className="absolute inset-0 z-0 w-full h-full overflow-hidden bg-background" />
        );
    }

    return (
        <div className="absolute inset-0 z-0 w-full h-full overflow-hidden bg-background">
            {canRender3D && (
                <CanvasErrorBoundary>
                    <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
                        <Suspense fallback={null}>
                            <Background isDark={isDark} />
                        </Suspense>
                    </Canvas>
                </CanvasErrorBoundary>
            )}

            {/* Overlay gradient for UI readability */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background/20 via-transparent to-background/50" />

            {/* Creative Energy Shader Placeholder - implemented via CSS/Canvas mix */}
            <motion.div
                className={`absolute inset-0 pointer-events-none opacity-30 ${isDark ? "mix-blend-screen" : "mix-blend-multiply"}`}
                animate={{
                    background: isDark
                        ? [
                            "radial-gradient(circle at 50% 50%, rgba(100, 108, 255, 0.1) 0%, transparent 50%)",
                            "radial-gradient(circle at 60% 40%, rgba(100, 108, 255, 0.15) 0%, transparent 50%)",
                            "radial-gradient(circle at 40% 60%, rgba(100, 108, 255, 0.1) 0%, transparent 50%)",
                            "radial-gradient(circle at 50% 50%, rgba(100, 108, 255, 0.1) 0%, transparent 50%)"
                        ]
                        : [
                            "radial-gradient(circle at 50% 50%, rgba(100, 108, 255, 0.05) 0%, transparent 50%)",
                            "radial-gradient(circle at 60% 40%, rgba(100, 108, 255, 0.08) 0%, transparent 50%)",
                            "radial-gradient(circle at 40% 60%, rgba(100, 108, 255, 0.05) 0%, transparent 50%)",
                            "radial-gradient(circle at 50% 50%, rgba(100, 108, 255, 0.05) 0%, transparent 50%)"
                        ]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
        </div>
    );
}
