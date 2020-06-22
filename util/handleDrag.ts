function isMouseEvent (e: MouseEvent | TouchEvent): e is MouseEvent {
  return ['mousedown', 'mousemove', 'mouseup'].includes(e.type)
}

export function handleDrag (
  element: HTMLElement, {
    onDragStart,
    onDragMove,
    onDragEnd,
  } : {
    onDragStart(e: MouseEvent | Touch): void
    onDragMove(e: MouseEvent | Touch): void
    onDragEnd(e: MouseEvent | Touch): void
  }
) {
  element.addEventListener('mousedown', onStart)
  element.addEventListener('touchstart', onStart)

  function onStart (e: MouseEvent | TouchEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (isMouseEvent(e)) {
      if (e.which === 1) {
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onEnd)
        onDragStart(e)
      }
    } else {
      document.addEventListener('touchmove', onMove)
      document.addEventListener('touchend', onEnd)
      onDragStart((e as TouchEvent).touches[0])
    }
  }

  function onMove (e: MouseEvent | TouchEvent) {
    if (isMouseEvent(e)) {
      onDragMove(e)
    } else {
      onDragMove(e.touches[0])
    }
  }

  function onEnd (e: MouseEvent | TouchEvent) {
    if (isMouseEvent(e)) {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onEnd)
      onDragEnd(e)
    } else {
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      onDragEnd(e.touches[0])
    }
  }
}