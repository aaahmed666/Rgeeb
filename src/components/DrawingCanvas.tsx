"use client";

/**
 * DrawingCanvas — ROI (Region of Interest) configuration editor.
 *
 * Ported from the old project's `@core/components/DrawingCanvas` (MUI + Redux)
 * to this codebase's stack: self-contained local state (no Redux), Tailwind +
 * shadcn primitives. Behaviour is preserved exactly:
 *   - Tools: Select / Line (two-click) / Polygon (click points + Finish).
 *   - Undo, Clear All, Delete Selected (also Delete/Backspace key).
 *   - A "Stored Shapes" panel listing every shape with its coordinates.
 *
 * A shape is just `{ id, points[] }`. 2 points render as a line; 3+ points
 * render as a closed area/polygon — matching the old data model so the camera
 * `services[].points` payload round-trips unchanged.
 */

import * as React from "react";
import { useTranslation } from "react-i18next";
import { MousePointer2, Minus, Hexagon, Undo2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  id: string;
  points: Point[];
}

export type ToolMode = "select" | "line" | "polygon";

interface DrawingCanvasProps {
  imageUrl?: string | null;
  canvasWidth?: number;
  canvasHeight?: number;
  initialShapes?: Shape[];
  onShapesChange?: (shapes: Shape[]) => void;
  showShapesList?: boolean;
  className?: string;
}

const LINE_COLOR = "#ef4444"; // rose-500
const SELECTED_COLOR = "#6366f1"; // indigo-500
const POLYGON_COLOR = "#22c55e"; // green-500

export function DrawingCanvas({
  imageUrl,
  canvasWidth = 600,
  canvasHeight = 450,
  initialShapes,
  onShapesChange,
  showShapesList = true,
  className,
}: DrawingCanvasProps) {
  const { t } = useTranslation();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const lastInitRef = React.useRef<string>("");

  const [shapes, setShapes] = React.useState<Shape[]>([]);
  const [tool, setTool] = React.useState<ToolMode>("line");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [startPoint, setStartPoint] = React.useState<Point | null>(null);
  const [currentShape, setCurrentShape] = React.useState<Shape | null>(null);
  const [polygonPoints, setPolygonPoints] = React.useState<Point[]>([]);

  // ── Initialize from props (reset only when initialShapes actually changes) ──
  React.useEffect(() => {
    const str = JSON.stringify(initialShapes ?? []);
    if (str === lastInitRef.current) return;
    lastInitRef.current = str;
    const normalized = (initialShapes ?? []).filter(
      (s) => s && Array.isArray(s.points) && s.points.length >= 2
    );
    setShapes(normalized);
    setSelectedId(null);
    setPolygonPoints([]);
    setStartPoint(null);
    setCurrentShape(null);
  }, [initialShapes]);

  // ── Notify parent of changes ──
  const onChangeRef = React.useRef(onShapesChange);
  onChangeRef.current = onShapesChange;
  React.useEffect(() => {
    onChangeRef.current?.(shapes);
    lastInitRef.current = JSON.stringify(shapes);
  }, [shapes]);

  // ── Load background image ──
  React.useEffect(() => {
    if (!imageUrl) {
      imageRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
      draw();
    };
    img.onerror = () => {
      imageRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  // ── Shape rendering ──
  const drawShape = React.useCallback(
    (ctx: CanvasRenderingContext2D, shape: Shape, isSelected: boolean) => {
      const pts = shape.points;
      if (!pts || pts.length < 2) return;
      const color = isSelected ? SELECTED_COLOR : LINE_COLOR;
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.fillStyle = isSelected
        ? "rgba(99,102,241,0.2)"
        : "rgba(239,68,68,0.18)";

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      if (pts.length > 2) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();

      pts.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      });
    },
    []
  );

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      // subtle grid so the empty canvas reads as a drawing surface
      ctx.fillStyle = "rgba(148,163,184,0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    shapes.forEach((s) => drawShape(ctx, s, s.id === selectedId));
    if (currentShape) drawShape(ctx, currentShape, false);

    if (polygonPoints.length > 0) {
      ctx.strokeStyle = POLYGON_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
      for (let i = 1; i < polygonPoints.length; i++)
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
      ctx.stroke();
      polygonPoints.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = POLYGON_COLOR;
        ctx.fill();
      });
    }
  }, [
    shapes,
    currentShape,
    selectedId,
    polygonPoints,
    drawShape,
    canvasWidth,
    canvasHeight,
  ]);

  React.useEffect(() => {
    draw();
  }, [draw]);

  // ── Geometry helpers ──
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const isPointInShape = (point: Point, shape: Shape): boolean => {
    const pts = shape.points;
    if (!pts || pts.length < 2) return false;
    if (pts.length === 2) {
      const [s, e] = pts;
      const len = Math.hypot(e.x - s.x, e.y - s.y);
      if (len === 0) return false;
      const dist =
        Math.abs(
          (e.y - s.y) * point.x -
            (e.x - s.x) * point.y +
            e.x * s.y -
            e.y * s.x
        ) / len;
      return (
        dist <= 10 &&
        point.x >= Math.min(s.x, e.x) - 5 &&
        point.x <= Math.max(s.x, e.x) + 5 &&
        point.y >= Math.min(s.y, e.y) - 5 &&
        point.y <= Math.max(s.y, e.y) + 5
      );
    }
    // ray casting
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      if (
        pts[i].y > point.y !== pts[j].y > point.y &&
        point.x <
          ((pts[j].x - pts[i].x) * (point.y - pts[i].y)) /
            (pts[j].y - pts[i].y) +
            pts[i].x
      )
        inside = !inside;
    }
    return inside;
  };

  const findShapeAtPoint = (point: Point): Shape | null => {
    for (let i = shapes.length - 1; i >= 0; i--)
      if (isPointInShape(point, shapes[i])) return shapes[i];
    return null;
  };

  // ── Mouse handlers ──
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    if (tool === "select") {
      setSelectedId(findShapeAtPoint(pos)?.id ?? null);
      return;
    }
    if (tool === "polygon") {
      setPolygonPoints((p) => [...p, pos]);
      setSelectedId(null);
      return;
    }
    // line — two-click
    if (!startPoint) {
      setSelectedId(null);
      setStartPoint(pos);
      setCurrentShape({ id: Date.now().toString(), points: [pos, pos] });
    } else {
      if (currentShape) {
        const finished: Shape = {
          ...currentShape,
          points: [currentShape.points[0], pos],
        };
        setShapes((s) => [...s, finished]);
      }
      setStartPoint(null);
      setCurrentShape(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "line" && startPoint && currentShape) {
      const pos = getMousePos(e);
      setCurrentShape({ ...currentShape, points: [currentShape.points[0], pos] });
    }
  };

  const finishPolygon = () => {
    if (polygonPoints.length >= 3) {
      setShapes((s) => [
        ...s,
        { id: Date.now().toString(), points: [...polygonPoints] },
      ]);
    }
    setPolygonPoints([]);
  };

  const deleteSelected = React.useCallback(() => {
    setShapes((s) => s.filter((x) => x.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  // ── Keyboard: Delete/Backspace removes selected ──
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        deleteSelected();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, deleteSelected]);

  const tools: Array<{ key: ToolMode; label: string; icon: React.ReactNode }> = [
    { key: "select", label: t("roi.select", "Select"), icon: <MousePointer2 className="h-4 w-4" /> },
    { key: "line", label: t("roi.line", "Line"), icon: <Minus className="h-4 w-4" /> },
    { key: "polygon", label: t("roi.polygon", "Polygon"), icon: <Hexagon className="h-4 w-4" /> },
  ];

  const instruction =
    tool === "select"
      ? t("roi.selectHint", "Click a shape to select it, then press Delete to remove it.")
      : tool === "polygon"
        ? t("roi.polygonHint", 'Click to add points (min 3). Click "Finish" to complete the area.')
        : startPoint
          ? t("roi.lineHintSecond", "Click the second point to finish the line.")
          : t("roi.lineHintFirst", "Click the first point to start the line.");

  return (
    <div className={cn("grid gap-4 lg:grid-cols-3", className)}>
      {/* Canvas + toolbar */}
      <div className={cn(showShapesList ? "lg:col-span-2" : "lg:col-span-3")}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {tools.map((tl) => (
            <Button
              key={tl.key}
              type="button"
              size="sm"
              variant={tool === tl.key ? "default" : "outline"}
              className="gap-1.5"
              onClick={() => {
                setTool(tl.key);
                if (tl.key !== "polygon") setPolygonPoints([]);
                if (tl.key !== "line") {
                  setStartPoint(null);
                  setCurrentShape(null);
                }
                if (tl.key !== "select") setSelectedId(null);
              }}
            >
              {tl.icon}
              {tl.label}
            </Button>
          ))}

          <div className="flex-1" />

          {polygonPoints.length > 0 && (
            <>
              <Button
                type="button"
                size="sm"
                onClick={finishPolygon}
                disabled={polygonPoints.length < 3}
              >
                {t("roi.finish", "Finish")} ({polygonPoints.length})
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPolygonPoints([])}
              >
                {t("common.cancel", "Cancel")}
              </Button>
            </>
          )}

          {selectedId && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="gap-1.5"
              onClick={deleteSelected}
            >
              <Trash2 className="h-4 w-4" />
              {t("roi.deleteSelected", "Delete")}
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setShapes((s) => s.slice(0, -1))}
            disabled={shapes.length === 0}
          >
            <Undo2 className="h-4 w-4" />
            {t("roi.undo", "Undo")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 text-destructive"
            onClick={() => {
              setShapes([]);
              setSelectedId(null);
              setPolygonPoints([]);
              setStartPoint(null);
              setCurrentShape(null);
            }}
            disabled={shapes.length === 0}
          >
            <Trash2 className="h-4 w-4" />
            {t("roi.clearAll", "Clear All")}
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border bg-muted/20">
          <canvas
            ref={canvasRef}
            className={cn(
              "block w-full",
              tool === "select" ? "cursor-pointer" : "cursor-crosshair"
            )}
            style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}` }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{instruction}</p>
      </div>

      {/* Stored shapes */}
      {showShapesList && (
        <div className="rounded-lg border p-3">
          <div className="mb-3 text-sm font-semibold">
            {t("roi.storedShapes", "Stored Shapes")} ({shapes.length})
          </div>
          {shapes.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("roi.empty", "Draw shapes on the canvas to see their coordinates here.")}
            </p>
          ) : (
            <div className="max-h-[320px] space-y-2 overflow-y-auto">
              {shapes.map((shape, index) => {
                const isLine = shape.points.length === 2;
                return (
                  <button
                    type="button"
                    key={shape.id}
                    onClick={() => {
                      setSelectedId(shape.id);
                      setTool("select");
                    }}
                    className={cn(
                      "w-full rounded-md border p-2.5 text-left transition",
                      shape.id === selectedId
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {index + 1}. {isLine ? t("roi.line", "Line") : t("roi.area", "Area")}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        className="text-destructive hover:opacity-70"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShapes((s) => s.filter((x) => x.id !== shape.id));
                          if (selectedId === shape.id) setSelectedId(null);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {isLine ? (
                        <>
                          <div>
                            {t("roi.start", "Start")}: ({Math.round(shape.points[0].x)},{" "}
                            {Math.round(shape.points[0].y)})
                          </div>
                          <div>
                            {t("roi.end", "End")}: ({Math.round(shape.points[1].x)},{" "}
                            {Math.round(shape.points[1].y)})
                          </div>
                        </>
                      ) : (
                        <>
                          {shape.points.slice(0, 3).map((pt, i) => (
                            <div key={i}>
                              P{i + 1}: ({Math.round(pt.x)}, {Math.round(pt.y)})
                            </div>
                          ))}
                          <div className="mt-0.5">
                            {t("roi.points", "Points")}: {shape.points.length}
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DrawingCanvas;
