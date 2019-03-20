(function () {
  'use strict';

  function createElement (type, attributes = {}, children = []) {
    const element = document.createElement(type);
    Object.assign(element, attributes);
    children.forEach(child => element.appendChild(child));
    return element
  }

  const div = () => document.createElement('div');

  function Title (title) {
    const element = div();
    element.className = 'title';
    element.innerText = title;
    return element
  }

  const LEGEND_ITEM_CLASS = 'legend-item-value';
  const LEGEND_ITEM_HIDDEN_CLASS = 'legend-item-value--hidden';
  const APPROX_LABEL_WIDTH = 40;

  function XAxis ({ points, viewBox, width }, store) {
    const element = div();
    element.className = 'x-axis';
    element.style.width = `${width}px`;
    const shiftingContainer = div();
    shiftingContainer.className = 'shifting-container';
    element.appendChild(shiftingContainer);
    const legendValues = [];
    const offsets = [];
    const visibility = [];

    for (let i = 0; i < points.length; i++) {
      const xValueElement = div();
      xValueElement.innerText = points[i].label;
      xValueElement.className = LEGEND_ITEM_CLASS;
      legendValues.push(xValueElement);
      shiftingContainer.appendChild(xValueElement);
    }

    setViewBox(viewBox);

    return { element, setViewBox }

    function setViewBox (viewBox) {
      const stepMiltiplier = calculateMultiplier(viewBox.endIndex - viewBox.startIndex);
      const xScale = (viewBox.endIndex - viewBox.startIndex) / (points.length - 1);
      const shift = Math.round(-1 / xScale * width * viewBox.startIndex / (points.length - 1));
      shiftingContainer.style.transform = `translateX(${shift}px)`;
      for (let i = 0; i < points.length; i++) {
        const xValueElement = legendValues[i];
        const offset = Math.round(points[i].x / xScale);

        if (store.resizingViewBox) {
          xValueElement.style.transform = `translateX(${offset}px)`;
        } else if (!offsets[i] || offsets[i] !== offset) {
          offsets[i] = offset;
          xValueElement.style.transform = `translateX(${offset}px)`;
        }
        //
        // }
        // if (!valuesWidths[i]) {
          // valuesWidths[i] = xValueElement.offsetWidth || APPROX_LABEL_WIDTH
        // }
        const isHidden =
          i % pow(2, stepMiltiplier)
          || (offset < -1 * shift)
          || (APPROX_LABEL_WIDTH + offset + shift > width);

        if (visibility.length < i || visibility[i] !== isHidden) {
          visibility[i] = isHidden;
          xValueElement.classList.toggle(
            LEGEND_ITEM_HIDDEN_CLASS,
            isHidden
          );
        }
      }
    }
  }

  function pow (a, b) {
    var result = a;
    for (let i = 1; i < b; i++) {
      result *= a;
    }
    return result
  }

  function calculateMultiplier (n) {
    for (let i = 3; i < 50; i++) {
      if (n < pow(2,i)) return i - 3
    }
  }

  const TOGGLE_VISIBILITY_STATE = 0;
  const VIEW_BOX_CHANGE = 1;

  const { max, ceil, floor, pow: pow$1 } = Math;

  function findMaxElement (values, { startIndex, endIndex }) {
    let maxValue = values[0][ceil(startIndex)];
    for (let j = 0; j < values.length; j++) {
      maxValue = max(maxValue, interpolatePoint(startIndex, values[j]), interpolatePoint(endIndex, values[j]));
      for (let i = ceil(startIndex); i <= endIndex; i++) {
        maxValue = max(values[j][i], maxValue);
      }
    }
    return maxValue
  }

  function getMaxValue (renderWindow, values) {
    const max = findMaxElement(values, renderWindow);
    if (max % 10 === 0) return max
    if (max % 5 === 0) return max
    return max + (5 - max % 5)
  }

  // h = H * w / W
  // O(n)
  function mapDataToCoords (data, max, targetContainer, { startIndex, endIndex }) {
    const coords = [];

    if (!Number.isInteger(startIndex)) {
      coords.push({
        x: 0,
        y: targetContainer.height - targetContainer.height / max * interpolatePoint(startIndex, data),
      });
    }

    for (let i = ceil(startIndex); i <= floor(endIndex); i++) {
      coords.push({
        x: targetContainer.width / (endIndex - startIndex) * (i - startIndex),
        y: targetContainer.height - targetContainer.height / max * data[i],
      });
    }

    if (!Number.isInteger(endIndex)) {
      coords.push({
        x: targetContainer.width,
        y: targetContainer.height - targetContainer.height / max * interpolatePoint(endIndex, data),
      });
    }

    return coords
  }

  function interpolatePoint (point, values) {
    return interpolate(
      floor(point), ceil(point),
      values[floor(point)], values[ceil(point)],
      point,
    )
  }

  function interpolate (x1, x2, y1, y2, x) {
    if (x === x2) return y2
    return (y2 - y1) / (x2 - x1) * (x - x1) + y1
  }

  function easing (t) {
    return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  function animate (from, to, duration, callback) {
    const startAnimationTime = Date.now();
    let lastDispatchedValue = from;
    let animating = true;
    let animationId;

    function frame () {
      const currentTime = Date.now();
      if (currentTime - startAnimationTime >= duration) {
        if (lastDispatchedValue !== to) {
          callback(to);
        }
        animating = false;
      } else {
        const currentValue = easing(
          (currentTime - startAnimationTime) / duration
        ) * (to - from) + from;
        callback(currentValue);
        lastDispatchedValue = currentValue;
        animationId = requestAnimationFrame(frame);
      }
    }
    animationId = requestAnimationFrame(frame);

    return function cancelAnimation () {
      if (animating) {
        cancelAnimationFrame(animationId);
      }
    }
  }

  const devicePixelRatio$1 = window.devicePixelRatio;
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const DOT_BORDER_SIZE = 2;
  const DOT_SIZE = 10;
  const offset = - DOT_SIZE / 2 - DOT_BORDER_SIZE;

  function TooltipCircle ({
    color,
    // x,
    // y,
    // visible,
  }) {
    const element = document.createElement('div');
    element.style.width = `${DOT_SIZE}px`;
    element.style.height = `${DOT_SIZE}px`;
    element.style.borderColor = color;
    element.className = 'tooltip__dot';

    return { element, hide, show, setPosition }

    function show () {
      element.style.visibility = 'visible';
    }

    function hide () {
      element.style.visibility = '';
    }

    function setPosition ({ x, y }) {
      element.style.transform = `translateX(${x + offset}px) translateY(${y + offset}px)`;
    }
  }

  const LINE_WIDTH = 1;

  function TooltipLine () {
    const element = document.createElement('div');
    element.className = 'tooltip-line';

    return { element, show, hide, setPosition }

    function show () {
      element.style.visibility = 'visible';
    }

    function hide () {
      element.style.visibility = '';
    }

    function setPosition (x) {
      element.style.transform = `translateX(${x - LINE_WIDTH / 2}px)`;
    }
  }

  function Tooltip ({
    graphNames,
    colors,
  }) {
    const element = document.createElement('div');
    element.className = 'tooltip';

    const tooltipDate = document.createElement('div');
    tooltipDate.style.padding = '10px 10px 0';
    element.appendChild(tooltipDate);

    const tooltipLegendContainer = document.createElement('div');
    tooltipLegendContainer.className = 'tooltip__legend';
    element.appendChild(tooltipLegendContainer);

    const tooltipValues = {};
    const graphInfos = {};
    graphNames.forEach(graphName => {
      const tooltipGraphInfo = document.createElement('div');
      tooltipGraphInfo.style.color = colors[graphName];
      tooltipGraphInfo.style.padding = '0 10px 10px';
      graphInfos[graphName] = tooltipGraphInfo;

      const tooltipValue = document.createElement('div');
      tooltipValue.style.fontWeight = 'bold';
      tooltipGraphInfo.appendChild(tooltipValue);

      const graphNameElement = document.createElement('div');
      graphNameElement.innerText = graphName;
      tooltipGraphInfo.appendChild(graphNameElement);

      tooltipValues[graphName] = tooltipValue;
      tooltipLegendContainer.appendChild(tooltipGraphInfo);
    });

    return { element, show, hide, setPosition, setDate, showValues }

    function show () {
      element.style.visibility = 'visible';
    }

    function hide () {
      element.style.visibility = '';
    }

    function setPosition (x) {
      element.style.transform = `translateX(calc(${x}px - 50%))`;
    }

    function setDate (text) {
      tooltipDate.innerText = getTooltipDateText(text);
    }

    function showValues (value) {
      for (const graphName in tooltipValues) {
        graphInfos[graphName].hidden = true;
      }
      for (const graphName in value) {
        graphInfos[graphName].hidden = false;
        tooltipValues[graphName].innerText = getValueText(value[graphName]);
      }
    }
  }

  function getValueText (num) {
    if(Math.abs(num) < 1000) {
      return num;
    }

    var shortNumber;
    var exponent;
    var size;
    var sign = num < 0 ? '-' : '';
    var suffixes = {
      'K': 6,
      'M': 9,
      'B': 12,
      'T': 16
    };

    num = Math.abs(num);
    size = Math.floor(num).toString().length;

    exponent = size % 3 === 0 ? size - 3 : size - (size % 3);
    shortNumber = Math.round(10 * (num / Math.pow(10, exponent))) / 10;

    for(var suffix in suffixes) {
      if(exponent < suffixes[suffix]) {
        shortNumber += suffix;
        break;
      }
    }

    return sign + shortNumber;
  }

  function getTooltipDateText (timestamp) {
    const date = new Date(timestamp);
    return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`
  }

  const HIDDEN_LAYER_CLASS = 'graph__layer--hidden';

  function Graph ({
    width,
    height,
    strokeStyle,
    lineWidth,
  }) {
    const element = document.createElement('canvas');
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.width = width * devicePixelRatio;
    element.height = height * devicePixelRatio;
    element.className = 'graph__layer';

    const context = element.getContext('2d');
    context.strokeStyle = strokeStyle;
    context.lineWidth = lineWidth * devicePixelRatio;

    return { element, toggleVisibility, clear, renderPath }

    function toggleVisibility () {
      element.classList.toggle(HIDDEN_LAYER_CLASS);
    }

    function clear () {
      context.clearRect(0, 0, width * devicePixelRatio, height * devicePixelRatio);
    }

    function renderPath (points) {
      context.beginPath();

      for (let i = 0; i < points.length; i++) {
        const { x, y } = points[i];
        context.lineTo(x, y);
      }

      context.stroke();
    }
  }

  const TRANSITION_DURATIONS = {
    [VIEW_BOX_CHANGE]: 150,
    [TOGGLE_VISIBILITY_STATE]: 250,
  };

  // graphNames, colors, visibilityStte, data
  function Graphs (config, {
    width,
    height,
    lineWidth,
    strokeStyles,
    viewBox: { startIndex, endIndex },
    showXAxis,
    showTooltip,
  }, store) {
    const fragment = document.createDocumentFragment();
    const canvasesContainer = div();
    canvasesContainer.style.width = `${width}px`;
    canvasesContainer.style.height = `${height}px`;
    canvasesContainer.className = 'graphs';

    const canvases = {};
    for (let i = 0; i < config.graphNames.length; i++) {
      const graph = Graph({ width, height, lineWidth, strokeStyle: strokeStyles[config.graphNames[i]] }, store);
      canvases[config.graphNames[i]] = graph;
      canvasesContainer.appendChild(graph.element);
    }
    let tooltipLine;
    let tooltip;
    let tooltipDots;
    if (showTooltip) {
      canvasesContainer.addEventListener('mousemove', onContainerMouseMove);
      canvasesContainer.addEventListener('mouseout', onContainerMouseOut);
      tooltipLine = TooltipLine();
      canvasesContainer.appendChild(tooltipLine.element);
      tooltip = Tooltip({
        graphNames: config.graphNames,
        colors: config.colors,
      });
      tooltipDots = {};
      for (let i = 0; i < config.graphNames.length; i++) {
        const tooltipCircle = TooltipCircle({ color: config.colors[config.graphNames[i]] });
        canvasesContainer.appendChild(tooltipCircle.element);
        tooltipDots[config.graphNames[i]] = tooltipCircle;
      }
      canvasesContainer.appendChild(tooltip.element);
    }
    fragment.appendChild(canvasesContainer);

    let dragging = false;
    let cancelAnimation;
    let currentAnimationTarget;
    const viewBox = {
      startIndex,
      endIndex,
    };
    let max = getMaxValue(viewBox, getArrayOfDataArrays(config.graphNames));
    let transitionDuration;
    let xAxis;

    if (showXAxis) {
      xAxis = XAxis({
        points: getXAxisPoints(),
        viewBox,
        width,
      }, store);
      fragment.appendChild(xAxis.element);
    }

    render();

    return {
      element: fragment,
      update,
      startDrag, stopDrag,
    }

    function update (event) {
      updateVisibilityState(event);
      updateViewBoxState(event);
      const visibleGraphNames = config.graphNames.filter(graphName => config.visibilityState[graphName]);
      if (!visibleGraphNames.length) return
      const arrayOfDataArrays = getArrayOfDataArrays(visibleGraphNames);
      const newMax = getMaxValue(viewBox, arrayOfDataArrays);
      // Maybe add onComplete callback to cleanup cancelAnimation and currentAnimationTarget
      if (max !== newMax && newMax !== currentAnimationTarget) {
        if (cancelAnimation) cancelAnimation();
        currentAnimationTarget = newMax;
        cancelAnimation = animate(max, newMax, transitionDuration, updateStateAndRender);
      } else {
        render();
      }
    }

    function updateStateAndRender (newMax) {
      max = newMax;
      render();
    }

    // function setYScale (yScale) {}

    // function setViewBox (viewBox) {}

    // yScale
    function render () {
      for (let i = 0; i < config.graphNames.length; i++) {
        const graphName = config.graphNames[i];
        canvases[graphName].clear();
        canvases[graphName].renderPath(
          mapDataToCoords(config.data[graphName], max, { width: width * devicePixelRatio$1, height: height * devicePixelRatio$1 }, viewBox)
        );
      }
    }

    // all data has already been precolulated
      // coords are sorted, can use binary search here
      // need input y here, not screen offset
    function onContainerMouseMove (e) {
      if (dragging) return

      const visibleGraphNames = config.graphNames.filter(graphName => config.visibilityState[graphName]);
      if (!visibleGraphNames.length) return
      tooltipLine.show();

      const arrayOfDataArrays = getArrayOfDataArrays(visibleGraphNames);
      const coords = mapDataToCoords(
        config.data[visibleGraphNames[0]],
        max,
        { width: width * devicePixelRatio$1, height: height * devicePixelRatio$1 },
        viewBox,
      );
      const newLeft = (e.clientX - canvasesContainer.getBoundingClientRect().x) * devicePixelRatio$1;

      let closestPointIndex = 0;
      for (let i = 1; i < coords.length; i++) {
        if (Math.abs(newLeft - coords[i].x) < Math.abs(newLeft - coords[closestPointIndex].x)) closestPointIndex = i;
      }

      const values = {};
      for (let i = 0; i < visibleGraphNames.length; i++) {
        const graphName = visibleGraphNames[i];

        const thisCoords = mapDataToCoords(config.data[graphName], max, { width: width * devicePixelRatio$1, height: height * devicePixelRatio$1 }, viewBox);
        tooltipDots[graphName].show();
        // xShift can be calculated once for all points
        const x = thisCoords[closestPointIndex].x / devicePixelRatio$1;
        const y = thisCoords[closestPointIndex].y / devicePixelRatio$1;
        tooltipDots[visibleGraphNames[i]].setPosition({ x, y });

        tooltip.show();
        tooltip.setPosition(x);
        const dataIndex = closestPointIndex + Math.floor(viewBox.startIndex);
        tooltip.setDate(config.domain[dataIndex]);
        values[graphName] = config.data[graphName][dataIndex];
      }
      tooltip.showValues(values);
      tooltipLine.setPosition(coords[closestPointIndex].x / devicePixelRatio$1);
    }

    function onContainerMouseOut () {
      tooltipLine.hide();
      tooltip.hide();
      Object.values(tooltipDots).forEach(dot => dot.hide());
    }

    function updateVisibilityState ({ type, graphName }) {
      if (type === TOGGLE_VISIBILITY_STATE) {
        canvases[graphName].toggleVisibility();
        transitionDuration = TRANSITION_DURATIONS[type];
      }
    }

    function updateViewBoxState ({ type, viewBox: newViewBox }) {
      if (type === VIEW_BOX_CHANGE) {
        Object.assign(viewBox, newViewBox);
        if (xAxis) { xAxis.setViewBox(viewBox); }
        transitionDuration = TRANSITION_DURATIONS[type];
      }
    }

    function getXAxisPoints () {
      return config.domain.map((timestamp, index) => ({
        x: width / (config.domain.length - 1) * index,
        label: getLabelText(timestamp)
      }))
    }

    function getArrayOfDataArrays (graphNames) {
      const arrayOfDataArrays = [];
      for (let i = 0; i < graphNames.length; i++) {
        arrayOfDataArrays.push(config.data[graphNames[i]]);
      }
      return arrayOfDataArrays
    }

    function startDrag () {
      dragging = true;
    }

    function stopDrag () {
      dragging = false;
    }
  }

  function getLabelText (timestamp) {
    const date = new Date(timestamp);
    return `${MONTHS[date.getMonth()]} ${date.getDate()}`
  }

  const minimalPixelsBetweenResizers = 40;
  const classes = {
    left: 'cursor-w-resize',
    right: 'cursor-e-resize',
    grabbing: 'cursor-grabbing',
  };

  function Framer (parentElement, chartConfig, onViewBoxChange, onDragStart, onDragEnd, store) {
    const frameContainer = div();
    frameContainer.classList.add('overview');
    const graphs = Graphs(chartConfig, {
      width: chartConfig.FRAME_CANVAS_WIDTH,
      height: chartConfig.FRAME_CANVAS_HEIGHT,
      strokeStyles: chartConfig.colors,
      lineWidth: chartConfig.FRAME_LINE_WIDTH,
      viewBox: {
        startIndex: 0,
        endIndex: chartConfig.data.total - 1,
      },
    });
    frameContainer.appendChild(graphs.element);
    const backgroundLeft = createElement('div', { className: 'overview__overflow overview__overflow--left' });
    const backgroundRight = createElement('div', { className: 'overview__overflow overview__overflow--right' });
    const resizerLeft = createElement('div', { className: 'overview__resizer overview__resizer--left' });
    const resizerRight = createElement('div', { className: 'overview__resizer overview__resizer--right' });
    const framer = createElement('div', { className: 'overview__viewbox' }, [resizerLeft, resizerRight]);
    frameContainer.appendChild(backgroundLeft);
    frameContainer.appendChild(backgroundRight);
    frameContainer.appendChild(framer);

    const frameState = {
      left: chartConfig.renderWindow.startIndex / (chartConfig.data.total - 1) * chartConfig.FRAME_CANVAS_WIDTH,
      right: chartConfig.FRAME_CANVAS_WIDTH,
      cursorResizerDelta: 0,
      cursorFramerDelta: 0,
    };

    backgroundLeft.style.width = `${frameState.left}px`;
    framer.style.left = `${frameState.left}px`;

    resizerLeft.addEventListener('mousedown', onLeftResizerMouseDown);
    resizerRight.addEventListener('mousedown', onRightResizerMouseDown);
    framer.addEventListener('mousedown', onFramerMouseDown);

    parentElement.appendChild(frameContainer);

    return graphs

    function onLeftResizerMouseDown (e) {
      onDragStart();
      store.startResizingViewBox();
      e.stopPropagation();
      e.preventDefault();
      document.body.classList.add(classes.left);
      framer.classList.add(classes.left);
      frameState.cursorResizerDelta = getX(e) - (resizerLeft.getBoundingClientRect().left - frameContainer.getBoundingClientRect().left),
      document.addEventListener('mouseup', removeLeftResizerListener);
      document.addEventListener('mousemove', onLeftResizerMouseMove);
    }

    function removeLeftResizerListener () {
      onDragEnd();
      store.stopResizingViewBox();
      document.body.classList.remove(classes.left);
      framer.classList.remove(classes.left);
      document.removeEventListener('mouseup', removeLeftResizerListener);
      document.removeEventListener('mousemove', onLeftResizerMouseMove);
    }

    function onLeftResizerMouseMove (e) {
      const left = ensureInFrameBounds(getX(e) - frameState.cursorResizerDelta);
      frameState.left = left > frameState.right - minimalPixelsBetweenResizers ? (frameState.right - minimalPixelsBetweenResizers) : left;
      backgroundLeft.style.width = `${frameState.left}px`;
      framer.style.left = `${frameState.left}px`;
      const startIndex = frameState.left / chartConfig.FRAME_CANVAS_WIDTH * (chartConfig.data.total - 1);
      onViewBoxChange({ startIndex });
    }

    function onRightResizerMouseDown (e) {
      onDragStart();
      store.startResizingViewBox();
      e.stopPropagation();
      e.preventDefault();
      document.body.classList.add(classes.right);
      framer.classList.add(classes.right);
      frameState.cursorResizerDelta = getX(e) - (resizerRight.getBoundingClientRect().right - frameContainer.getBoundingClientRect().left),
      document.addEventListener('mouseup', removeRightResizerListener);
      document.addEventListener('mousemove', onRightResizerMouseMove);
    }

    function removeRightResizerListener () {
      onDragEnd();
      store.stopResizingViewBox();
      document.body.classList.remove(classes.right);
      framer.classList.remove(classes.right);
      document.removeEventListener('mouseup', removeRightResizerListener);
      document.removeEventListener('mousemove', onRightResizerMouseMove);
    }

    function onRightResizerMouseMove (e) {
      const right = ensureInFrameBounds(getX(e) - frameState.cursorResizerDelta);
      frameState.right = right < frameState.left + minimalPixelsBetweenResizers ? (frameState.left + minimalPixelsBetweenResizers) : right;
      backgroundRight.style.left = `${frameState.right}px`;
      framer.style.right = `${chartConfig.FRAME_CANVAS_WIDTH - (frameState.right)}px`;
      const endIndex = (frameState.right) / chartConfig.FRAME_CANVAS_WIDTH * (chartConfig.data.total - 1);
      onViewBoxChange({ endIndex });
    }

    function getX (event) {
      const { left } = frameContainer.getBoundingClientRect();
      return event.clientX - left + window.scrollX - document.documentElement.scrollLeft
    }

    function ensureInFrameBounds (x) {
      if (x > chartConfig.FRAME_CANVAS_WIDTH) return chartConfig.FRAME_CANVAS_WIDTH
      if (x < 0) return 0
      return x
    }

    function onFramerMouseDown (e) {
      onDragStart();
      store.startDraggingViewBox();
      frameState.cursorFramerDelta = getX(e) - (framer.getBoundingClientRect().left - frameContainer.getBoundingClientRect().left),
      framer.classList.add(classes.grabbing);
      document.body.classList.add(classes.grabbing);
      resizerLeft.classList.add(classes.grabbing);
      resizerRight.classList.add(classes.grabbing);
      document.addEventListener('mouseup', onFramerMouseUp);
      document.addEventListener('mousemove', onFramerMouseMove);
    }

    function onFramerMouseUp () {
      onDragEnd();
      store.stopDraggingViewBox();
      document.body.classList.remove(classes.grabbing);
      framer.classList.remove(classes.grabbing);
      resizerLeft.classList.remove(classes.grabbing);
      resizerRight.classList.remove(classes.grabbing);
      document.removeEventListener('mouseup', onFramerMouseUp);
      document.removeEventListener('mousemove', onFramerMouseMove);
    }

    function onFramerMouseMove (e) {
      const width = frameState.right - frameState.left;
      const nextLeft = getX(e) - frameState.cursorFramerDelta;
      if (nextLeft < 0) {
        frameState.left = 0;
      } else if (nextLeft > chartConfig.FRAME_CANVAS_WIDTH - width) {
        frameState.left = chartConfig.FRAME_CANVAS_WIDTH - width;
      } else {
        frameState.left = nextLeft;
      }
      frameState.right = frameState.left + width;
      framer.style.left = `${frameState.left}px`;
      framer.style.right = `${chartConfig.FRAME_CANVAS_WIDTH - (frameState.right)}px`;
      backgroundLeft.style.width = `${frameState.left}px`;
      backgroundRight.style.left = `${frameState.right}px`;
      const startIndex = frameState.left / chartConfig.FRAME_CANVAS_WIDTH * (chartConfig.data.total - 1);
      const endIndex = (frameState.right) / (chartConfig.FRAME_CANVAS_WIDTH) * (chartConfig.data.total - 1);
      onViewBoxChange({ startIndex, endIndex });
    }
  }

  function Controls (config, onButtonClick) {
    return createElement('div', { style: 'margin-top: 20px'}, config.graphNames.map(graphName =>
      createElement('label', { style: `color: ${config.colors[graphName]}` }, [
        createElement('input', {
          checked: true,
          type: 'checkbox',
          className: 'button',
          onclick: () => onButtonClick(graphName),
        }),
        createElement('div', { className: 'like-button' }, [
          createElement('div', { className: 'button-text', innerText: graphName })
        ])
      ])
    ))
  }

  const createStore = () => ({
    resizingViewBox: false,
    draggingViewBox: false,

    startResizingViewBox () {
      this.resizingViewBox = true;
      this.draggingViewBox = false;
    },

    stopResizingViewBox () {
      this.resizingViewBox = false;
    },

    startDraggingViewBox () {
      this.resizingViewBox = false;
      this.draggingViewBox = true;
    },

    stopDraggingViewBox () {
      this.draggingViewBox = false;
    },
  });

  function Chart (chartConfig) {
    const store = createStore();
    const containerElement = div();
    containerElement.style.height = '100vh';
    containerElement.appendChild(Title('Followers'));
    const graphs = Graphs(chartConfig, {
      width: chartConfig.width,
      height: chartConfig.height,
      lineWidth: chartConfig.lineWidth,
      strokeStyles: chartConfig.colors,
      viewBox: chartConfig.renderWindow,
      showXAxis: true,
      showTooltip: true,
    }, store);

    containerElement.appendChild(graphs.element);
    const overview = Framer(containerElement, chartConfig, onViewBoxChange, onDragStart, onDragEnd, store);
    containerElement.appendChild(Controls(chartConfig, onButtonClick));
    document.body.appendChild(containerElement);

    function onButtonClick (graphName) {
      chartConfig.visibilityState[graphName] = !chartConfig.visibilityState[graphName];
      graphs.update({
        type: TOGGLE_VISIBILITY_STATE,
        graphName,
      });
      overview.update({
        type: TOGGLE_VISIBILITY_STATE,
        graphName,
      });
    }

    function onViewBoxChange (viewBox) {
      graphs.update({
        type: VIEW_BOX_CHANGE,
        viewBox,
      });
    }

    function onDragStart () {
      graphs.startDrag();
    }

    function onDragEnd () {
      graphs.stopDrag();
    }
  }

  const LIGHT = 0;
  const DARK = 1;

  const label = {
    [LIGHT]: 'Switch to Night Mode',
    [DARK]: 'Switch to Day Mode',
  };

  const classNames = {
    [LIGHT]: 'theme-light',
    [DARK]: 'theme-dark',
  };

  function ThemeSwitcher (initialTheme) {
    let theme = initialTheme;

    const button = document.createElement('button');
    button.innerText = label[theme];
    button.classList.add('theme-switcher');
    button.addEventListener('click', function () {
      document.body.classList.remove(classNames[theme]);
      theme = theme === LIGHT ? DARK : LIGHT;
      button.innerText = label[theme];
      document.body.classList.add(classNames[theme]);
    });

    return button
  }

  const LINE_WIDTH$1 = 2;
  const FRAME_LINE_WIDTH = 1;
  const CANVAS_WIDTH = 768;
  const CANVAS_HEIGHT = 300;
  const FRAME_CANVAS_HEIGHT = 50;
  const FRAME_CANVAS_WIDTH = CANVAS_WIDTH;

  function createChartConfig (chartData) {
    const graphNames = chartData['columns']
      .map(column => column[0])
      .filter(graphName => chartData['types'][graphName] === 'line');
    const domain = chartData['columns'].find(column => column[0] === 'x').slice(1);

    const data = chartData['columns'].reduce((data, column) => ({
      ...data,
      [column[0]]: column.slice(1),
      total: max(data.total, column.length - 1)
    }), {
      total: 0,
    });
    const visibilityState = graphNames.reduce((visibilityState, graphName) => ({
      ...visibilityState,
      [graphName]: true,
    }), {});
    const renderWindow = {
      startIndex: ceil(data.total / 3 * 2),
      endIndex: data.total - 1,
    };

    return {
      data,
      domain,
      graphNames,
      visibilityState,
      renderWindow,
      colors: chartData['colors'],
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      lineWidth: LINE_WIDTH$1,
      FRAME_CANVAS_WIDTH,
      FRAME_CANVAS_HEIGHT,
      FRAME_LINE_WIDTH,
    }
  }

  document.body.appendChild(ThemeSwitcher(1));

  // 1/3, 1/2, 1/3, 1/3, 1/2
  // Chart(createChartConfig(chartData[0]))
  chartData.forEach(data => Chart(createChartConfig(data)));

}());
