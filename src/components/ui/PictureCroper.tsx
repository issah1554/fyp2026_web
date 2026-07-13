import React, { useRef, useState, useEffect } from "react";
import { Button } from "./Buttons";

interface ProfilePictureEditorProps {
    aspectRatio?: number; // width / height
    cropScale?: number;   // fraction of canvas size (0–1)
    onComplete?: (dataUrl: string) => void;
}

const ProfilePictureEditor: React.FC<ProfilePictureEditorProps> = ({
    aspectRatio = 1,
    cropScale = 1,
    onComplete,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [start, setStart] = useState<{ x: number; y: number } | null>(null);
    const [zoom, setZoom] = useState(1);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 });

    // Responsive canvas
    const updateCanvasSize = () => {
        if (!containerRef.current) return;
        const width = Math.min(containerRef.current.offsetWidth, 800);
        const height = (width / 800) * 400;
        setCanvasSize({ width, height });
    };

    useEffect(() => {
        updateCanvasSize();
        window.addEventListener("resize", updateCanvasSize);
        return () => window.removeEventListener("resize", updateCanvasSize);
    }, []);

    // Crop rect
    const crop = (() => {
        let cropWidth = canvasSize.width * cropScale;
        let cropHeight = cropWidth / aspectRatio;

        if (cropHeight > canvasSize.height * cropScale) {
            cropHeight = canvasSize.height * cropScale;
            cropWidth = cropHeight * aspectRatio;
        }

        return {
            width: cropWidth,
            height: cropHeight,
            x: (canvasSize.width - cropWidth) / 2,
            y: (canvasSize.height - cropHeight) / 2,
        };
    })();

    // Draw
    useEffect(() => {
        if (!image || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

        const drawWidth = image.width * zoom;
        const drawHeight = image.height * zoom;
        ctx.drawImage(image, imageOffset.x, imageOffset.y, drawWidth, drawHeight);

        const themeStyles = getComputedStyle(document.documentElement);
        ctx.strokeStyle = themeStyles.getPropertyValue("--accent-500").trim();
        ctx.lineWidth = 3;
        ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

        ctx.fillStyle = themeStyles.getPropertyValue("--main-950").trim();
        ctx.beginPath();
        ctx.rect(0, 0, canvasSize.width, canvasSize.height);
        ctx.rect(crop.x, crop.y, crop.width, crop.height);
        ctx.fill("evenodd");
    }, [image, imageOffset, zoom, canvasSize, crop]);

    // Upload
    const loadFile = (file: File) => {
        if (!file) return;

        const img = new Image();
        img.onload = () => {
            const scaleX = crop.width / img.width;
            const scaleY = crop.height / img.height;
            const initialZoom = Math.max(scaleX, scaleY);

            setImage(img);
            setZoom(initialZoom);

            const drawWidth = img.width * initialZoom;
            const drawHeight = img.height * initialZoom;

            setImageOffset({
                x: crop.x + (crop.width - drawWidth) / 2,
                y: crop.y + (crop.height - drawHeight) / 2,
            });
        };
        img.src = URL.createObjectURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) loadFile(file);
    };

    // Drag
    const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setDragging(true);
        const point = "touches" in e ? e.touches[0] : e;
        setStart({ x: point.clientX, y: point.clientY });
    };

    const onDrag = (e: React.MouseEvent | React.TouchEvent) => {
        if (!dragging || !start || !image) return;
        const point = "touches" in e ? e.touches[0] : e;

        const dx = point.clientX - start.x;
        const dy = point.clientY - start.y;

        setImageOffset((prev) => {
            let x = prev.x + dx;
            let y = prev.y + dy;

            const w = image.width * zoom;
            const h = image.height * zoom;

            if (x > crop.x) x = crop.x;
            if (y > crop.y) y = crop.y;
            if (x + w < crop.x + crop.width) x = crop.x + crop.width - w;
            if (y + h < crop.y + crop.height) y = crop.y + crop.height - h;

            return { x, y };
        });

        setStart({ x: point.clientX, y: point.clientY });
    };

    const endDrag = () => setDragging(false);

    // Save
    const saveImage = () => {
        if (!canvasRef.current || !image) return;
        const out = document.createElement("canvas");
        out.width = crop.width;
        out.height = crop.height;
        const ctx = out.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(
            image,
            crop.x - imageOffset.x,
            crop.y - imageOffset.y,
            crop.width,
            crop.height,
            0,
            0,
            crop.width,
            crop.height
        );

        onComplete?.(out.toDataURL("image/png"));
    };

    const zoomIn = () => setZoom((z) => Math.min(z + 0.1, 3));
    const zoomOut = () => {
        if (!image) return;
        const minZoom = Math.max(crop.width / image.width, crop.height / image.height);
        setZoom((z) => Math.max(z - 0.1, minZoom));
    };

    return (
        <div
            ref={containerRef}
            className="mx-auto w-full max-w-200 select-none text-center font-sans"
            onMouseMove={onDrag}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onTouchMove={onDrag}
            onTouchEnd={endDrag}
        >
            {!image && (
                <div
                    className="cursor-pointer rounded-xl border-2 border-dashed border-info-500 bg-main-100 p-10 text-main-600 transition hover:bg-main-200"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) loadFile(file);
                    }}
                    onClick={() =>
                        (document.getElementById("fileInput") as HTMLInputElement)?.click()
                    }
                >
                    <i className="bi bi-cloud-arrow-up text-3xl text-info-500" />
                    <p className="mt-3 text-base">
                        Drag & drop an image or{" "}
                        <span className="font-semibold text-info-500">browse</span>
                    </p>
                    <input
                        id="fileInput"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            )}

            {image && (
                <>
                    <div className="relative mt-5">
                        <canvas
                            ref={canvasRef}
                            width={canvasSize.width}
                            height={canvasSize.height}
                            className="w-full rounded-lg border-2 border-main-300 bg-main-100 cursor-grab"
                            onMouseDown={startDrag}
                            onTouchStart={startDrag}
                        />
                    </div>

                    <div className="mt-4 flex flex-wrap justify-center gap-4">
                        <Button onClick={zoomOut} color={"secondary"} size={"md"}  >
                            <i className="bi bi-zoom-out" />
                        </Button>
                        <Button onClick={zoomIn} color={"secondary"} size={"md"}  >
                            <i className="bi bi-zoom-in" />
                        </Button>
                        <Button onClick={saveImage} color={"success"} size={"md"}  >
                            <i className="bi bi-check2 f" />
                        </Button>
                        <Button onClick={() => setImage(null)} color={"error"} size={"md"}  >
                            <i className="bi bi-arrow-repeat" />
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};
export default ProfilePictureEditor;
