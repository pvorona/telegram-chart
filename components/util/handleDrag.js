export function handleDrag (element, { onDragStart, onDragMove, onDragEnd }) {
  element.addEventListener('mousedown', onStart)
  element.addEventListener('touchstart', onStart)

  function onStart (e) {
    e.preventDefault()
    e.stopPropagation()
    switch (event.type) {
      case 'mousedown':
        if (event.which === 1) {
          document.addEventListener('mousemove', onMove)
          document.addEventListener('mouseup', onEnd)
          onDragStart(e)
        }
        break
      case 'touchstart':
        document.addEventListener('touchmove', onMove)
        document.addEventListener('touchend', onEnd)
        onDragStart(e.touches[0])
        break;
    }
  }

  function onMove (e) {
    switch (event.type) {
      case 'mousemove':
        onDragMove(e)
        break
      case 'touchmove':
        onDragMove(e.touches[0])
        break
    }
  }

  function onEnd (e) {
    switch (e.type) {
      case 'mouseup':
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onEnd)
        onDragEnd(e)
        break
      case 'touchend':
        document.removeEventListener('touchmove', onMove)
        document.removeEventListener('touchend', onEnd)
        onDragEnd(e.touches[0])
        break
    }
  }
}