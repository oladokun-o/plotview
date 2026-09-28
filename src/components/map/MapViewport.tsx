"use client"

import { useEffect, useRef, useState, type PointerEvent, type ReactNode, type RefObject, type MouseEvent } from "react"
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch"
import type { Rect } from "@/lib/geometry"
import { cn } from "@/lib/cn"
import { CAMERA_MAX_SCALE, CAMERA_MIN_SCALE, focusRect, frameRect, type CameraTransform, type Viewport } from "./camera"

/** Imperative camera controls, shared by both map views. */
export interface CameraApi {
  /** Show the whole map. */
  fit(options?: { animate?: boolean }): void
  /**
   * Centre one area in the visible part of the viewport. By default it is framed
   * to fill `fill` of the space; with `targetSize` it is zoomed so its short side
   * is that many pixels on screen, leaving its surroundings in view.
   */
  focus(rect: Rect, options?: { fill?: number; targetSize?: number; maxScale?: number; animate?: boolean }): void
  /**
   * Bring an area into view with as little movement as possible: nothing if it
   * is already comfortably visible, otherwise centre it and zoom in only as far
   * as needed to make it easy to see.
   */
  reveal(rect: Rect): void
  zoomIn(): void
  zoomOut(): void
  /** True once the person has panned or zoomed since the last fit. */
  hasUserMoved(): boolean
  /** The current pan and zoom. */
  getTransform(): CameraTransform
  /** Jump (or glide) straight to a transform computed elsewhere. */
  setTransform(transform: CameraTransform, options?: { animate?: boolean }): void
}

interface MapViewportProps {
  contentWidth: number
  contentHeight: number
  viewport: Viewport
  cameraRef: RefObject<CameraApi | null>
  label: string
  /** Called on every pan/zoom frame, including camera animations. */
  onTransform?: (scale: number) => void
  className?: string
  children: ReactNode
}

const GLIDE_MS = 700
const ZOOM_MS = 320
const ZOOM_FACTOR = 1.6
/** On screen, a revealed plot is at least this many pixels across its short side. */
const REVEAL_MIN_SIZE = 14
/** Pointer travel (px) after which a press counts as a drag, not a click. */
const DRAG_THRESHOLD = 6

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function MapViewport({
  contentWidth,
  contentHeight,
  viewport,
  cameraRef,
  label,
  onTransform,
  className,
  children,
}: MapViewportProps) {
  const zoomRef = useRef<ReactZoomPanPinchRef>(null)
  const userMoved = useRef(false)
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const dragged = useRef(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const apply = (transform: CameraTransform, duration: number) => {
      const time = prefersReducedMotion() ? 0 : duration
      zoomRef.current?.setTransform(transform.x, transform.y, transform.scale, time, "easeInOutCubic")
    }

    const zoomBy = (factor: number) => {
      const state = zoomRef.current?.instance.state
      if (!state) {
        return
      }
      const scale = Math.min(Math.max(state.scale * factor, CAMERA_MIN_SCALE), CAMERA_MAX_SCALE)
      const { insets } = viewport
      const centerX = insets.left + (viewport.width - insets.left - insets.right) / 2
      const centerY = insets.top + (viewport.height - insets.top - insets.bottom) / 2
      const ratio = scale / state.scale
      userMoved.current = true
      apply(
        { scale, x: centerX - (centerX - state.positionX) * ratio, y: centerY - (centerY - state.positionY) * ratio },
        ZOOM_MS,
      )
    }

    cameraRef.current = {
      fit({ animate = true } = {}) {
        userMoved.current = false
        apply(frameRect({ x: 0, y: 0, width: contentWidth, height: contentHeight }, viewport), animate ? GLIDE_MS : 0)
        setReady(true)
      },
      focus(rect, { fill = 0.9, targetSize, maxScale = CAMERA_MAX_SCALE, animate = true } = {}) {
        userMoved.current = true
        const transform =
          targetSize === undefined
            ? frameRect(rect, viewport, fill, maxScale)
            : focusRect(rect, viewport, targetSize, maxScale)
        apply(transform, animate ? GLIDE_MS : 0)
        setReady(true)
      },
      reveal(rect) {
        const state = zoomRef.current?.instance.state
        if (!state) {
          return
        }
        const { insets } = viewport
        const comfortable = Math.max(state.scale, REVEAL_MIN_SIZE / Math.min(rect.width, rect.height))
        const left = state.positionX + rect.x * state.scale
        const top = state.positionY + rect.y * state.scale
        const right = left + rect.width * state.scale
        const bottom = top + rect.height * state.scale
        const visible =
          left >= insets.left &&
          top >= insets.top &&
          right <= viewport.width - insets.right &&
          bottom <= viewport.height - insets.bottom
        if (visible && comfortable === state.scale) {
          return
        }
        const scale = Math.min(comfortable, CAMERA_MAX_SCALE)
        const centerX = insets.left + (viewport.width - insets.left - insets.right) / 2
        const centerY = insets.top + (viewport.height - insets.top - insets.bottom) / 2
        userMoved.current = true
        apply(
          {
            scale,
            x: centerX - (rect.x + rect.width / 2) * scale,
            y: centerY - (rect.y + rect.height / 2) * scale,
          },
          GLIDE_MS,
        )
      },
      zoomIn: () => zoomBy(ZOOM_FACTOR),
      zoomOut: () => zoomBy(1 / ZOOM_FACTOR),
      hasUserMoved: () => userMoved.current,
      getTransform() {
        const state = zoomRef.current?.instance.state
        return state ? { x: state.positionX, y: state.positionY, scale: state.scale } : { x: 0, y: 0, scale: 1 }
      },
      setTransform(transform, { animate = false } = {}) {
        apply(transform, animate ? GLIDE_MS : 0)
        setReady(true)
      },
    }
  })

  const markMoved = () => {
    userMoved.current = true
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    pointerStart.current = { x: event.clientX, y: event.clientY }
    dragged.current = false
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStart.current
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > DRAG_THRESHOLD) {
      dragged.current = true
    }
  }

  // A drag that ends over a plot must not select it.
  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (dragged.current) {
      event.stopPropagation()
      dragged.current = false
    }
  }

  return (
    <div
      className={cn("absolute inset-0 touch-none select-none", className)}
      role="region"
      aria-label={label}
      onPointerDownCapture={handlePointerDown}
      onPointerMoveCapture={handlePointerMove}
      onClickCapture={handleClickCapture}
    >
      <TransformWrapper
        ref={zoomRef}
        minScale={CAMERA_MIN_SCALE}
        maxScale={CAMERA_MAX_SCALE}
        limitToBounds={false}
        doubleClick={{ mode: "zoomIn", step: 0.7, animationTime: ZOOM_MS, animationType: "easeOutCubic" }}
        wheel={{ step: 0.08 }}
        autoAlignment={{ disabled: true }}
        onPanning={markMoved}
        onWheelStart={markMoved}
        onPinchStart={markMoved}
        onTransform={(_, state) => onTransform?.(state.scale)}
      >
        <TransformComponent
          wrapperStyle={{ width: "100%", height: "100%" }}
          contentStyle={{ width: contentWidth, height: contentHeight }}
        >
          <div
            className={cn(
              "h-full w-full transition-opacity duration-500 ease-standard",
              ready ? "opacity-100" : "opacity-0",
            )}
          >
            {children}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}
