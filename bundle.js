var foo = (function (exports) {
  'use strict';

  function Title (title) {
    const element = document.createElement('div');
    element.classList.add('title');
    element.innerText = title;
    return element
  }

  const EVENTS = {
    TOGGLE_VISIBILITY_STATE: 'TOGGLE_VISIBILITY_STATE',
    VIEW_BOX_CHANGE: 'VIEW_BOX_CHANGE',
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const LEGEND_ITEM_CLASS = 'legend-item-value';
  const LEGEND_ITEM_HIDDEN_CLASS = 'legend-item-value--hidden';

  function XAxis ({
    domain,
    points,
    viewBox,
  }) {
    const containerElement = document.createElement('div');
    containerElement.style = 'overflow:hidden;max-width: 768px;padding: 5px 0 15px;';
    const shiftingContainer = document.createElement('div');
    shiftingContainer.classList.add('shifting-container');
    containerElement.appendChild(shiftingContainer);
    const legendValues = [];

    for (let i = 0; i < points.length; i++) {
      const timestamp = domain[i];
      const xValueElement = document.createElement('div');
      xValueElement.innerText = getLabelText(timestamp);
      xValueElement.classList.add(LEGEND_ITEM_CLASS);
      legendValues.push(xValueElement);
      shiftingContainer.appendChild(xValueElement);
    }

    reconcile();

    function reconcile () {
      const stepMiltiplier = calculateMultiplier(viewBox.endIndex - viewBox.startIndex);
      const xScale = (viewBox.endIndex - viewBox.startIndex) / (domain.length - 1);
      const shift = -1 / xScale * 768 * viewBox.startIndex / (domain.length - 1);
      shiftingContainer.style.transform = `translateX(${shift}px)`;
      for (let i = 0; i < points.length; i++) {
        const xValueElement = legendValues[i];
        const offset = points[i].x / xScale;
        xValueElement.style.transform = `translateX(${offset}px)`;
        xValueElement.classList.toggle(
          LEGEND_ITEM_HIDDEN_CLASS,
          i % Math.pow(2, stepMiltiplier)
          || (offset < -1 * shift)
          || (xValueElement.offsetWidth + offset + shift > 768)
        );
      }
    }

    return [containerElement, update]

    function update ({ type }) {
      if (type === EVENTS.VIEW_BOX_CHANGE) {
        reconcile();
      }
    }

    function getLabelText (timestamp) {
      const date = new Date(timestamp);
      return `${MONTHS[date.getMonth()]} ${date.getDate()}`
    }

    // Not smart enough to find analytic representation for this function
    function calculateMultiplier (size) {
        if      (size < Math.pow(2, 3)) return 0
        else if (size < Math.pow(2, 4)) return 1
        else if (size < Math.pow(2, 5)) return 2
        else if (size < Math.pow(2, 6)) return 3
        else if (size < Math.pow(2, 7)) return 4
        else if (size < Math.pow(2, 8)) return 5
        else if (size < Math.pow(2, 9)) return 6
        else if (size < Math.pow(2, 10)) return 7
        else if (size < Math.pow(2, 11)) return 8
        else if (size < Math.pow(2, 12)) return 9
        else if (size < Math.pow(2, 13)) return 10

    }
  }

  var renderPath = canvasRenderer;

  function canvasRenderer (points, targetContext) {
    targetContext.beginPath();

    for (let i = 0; i < points.length; i++) {
      const { x, y } = points[i];
      targetContext.lineTo(x, y);
    }

    targetContext.stroke();
  }

  function findMaxElement (values, { startIndex, endIndex }) {
    let max = values[0][Math.ceil(startIndex)];
    for (let j = 0; j < values.length; j++) {
      max = Math.max(max, interpolatePoint(startIndex, values[j]), interpolatePoint(endIndex, values[j]));
      for (let i = Math.ceil(startIndex); i <= endIndex; i++) {
        max = Math.max(values[j][i], max);
      }
    }
    return max
  }

  function getMaxValue (renderWindow, ...values) {
    const max = findMaxElement(values, renderWindow);
    if (Number.isNaN(max)) {
      debugger
    }
    if (max % 10 === 0) return max
    if (max % 5 === 0) return max
    return max + (5 - max % 5)
  }

  function clearCanvas (context, canvas) {
    context.clearRect(0, 0, canvas.width, canvas.height);
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

    for (let i = Math.ceil(startIndex); i <= Math.floor(endIndex); i++) {
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
      [Math.floor(point), Math.ceil(point)],
      [values[Math.floor(point)], values[Math.ceil(point)]],
      point,
    )
  }

  function interpolate ([x1, x2], [y1, y2], x) {
    if (x === x1) return y1
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

  function createElement (type, attributes = {}, children = []) {
    const element = document.createElement(type);
    setElementAttributes(element, attributes);
    children.forEach(child => element.appendChild(child));
    return element
  }

  function validateElementAttributes (element, props) {
    for (let prop in props) {
      if (!(prop in element)) throw Error('No such prop')
    }
  }

  function setElementAttributes (element, attributes) {
    validateElementAttributes(element, attributes);
    for (const attributeName in attributes) {
      element[attributeName] = attributes[attributeName];
    }
  }

  function createCanvases (graphNames, attributes) {
    return graphNames.reduce((canvases, graphName) => ({
      ...canvases,
      [graphName]: createElement('canvas', attributes),
    }), {})
  }

  const HIDDEN_LAYER_CLASS = 'graph__layer--hidden';

  function Graphs (parentElement, config, {
    width,
    height,
    lineWidth,
    strokeStyles,
    viewBox: { startIndex, endIndex },
    showXAxis,
  }) {
    const canvases = createCanvases(config.graphNames, {
      style: `width: ${width}px; height: ${height}px`,
      width: width * devicePixelRatio,
      height: height * devicePixelRatio,
      className: 'graph__layer',
    });
    const canvasesContainer = createElement('div', {
      style: `width: ${width}px; height: ${height}px`,
    }, Object.values(canvases));
    const contexts = config.graphNames.reduce((contexts, graphName) => ({
      ...contexts,
      [graphName]: canvases[graphName].getContext('2d'),
    }), {});
    config.graphNames.forEach(graphName =>
      Object.assign(contexts[graphName], {
        strokeStyle: strokeStyles[graphName],
        lineWidth: lineWidth * devicePixelRatio,
      })
    );

    const viewBoxChangeTransitionDuration = 150;
    const visibilityStateChangeTransitionDuration = 250;
    let cancelAnimation;
    let currentAnimationTarget;

    const arrayOfDataArrays = config.graphNames.reduce(
      (reduced, graphName) => [...reduced, config.data[graphName]], []
    );
    const viewBox = {
      startIndex,
      endIndex,
    };
    let max = getMaxValue(viewBox, ...arrayOfDataArrays);
    let transitionDuration;

    render();

    parentElement.appendChild(canvasesContainer);

    const xAxisPoints = [];
    for (let i = 0; i < config.data.total; i++) {
      xAxisPoints.push({
        x: width / (config.data.total - 1 - 0) * (i - 0),
      });
    }
    const [xAxis, updateXAxis] = XAxis({
      domain: config.domain,
      points: xAxisPoints,
      viewBox,
    });

    if (showXAxis) {
      parentElement.appendChild(xAxis);
    }

    return update

    function update (event) {
      updateVisibilityState(event);
      updateViewBoxState(event);
      if (showXAxis) { updateXAxis(event); }
      const visibleGraphNames = config.graphNames.filter(graphName => config.visibilityState[graphName]);
      if (!visibleGraphNames.length) return
      const arrayOfDataArrays = visibleGraphNames.reduce((reduced, graphName) => [...reduced, config.data[graphName]], []);
      const newMax = getMaxValue(viewBox, ...arrayOfDataArrays);
      // Maybe add onComplete callback to cleanup cancelAnimation and currentAnimationTarget
      if (max !== newMax && newMax !== currentAnimationTarget) {
        if (cancelAnimation) cancelAnimation();
        currentAnimationTarget = newMax;
        cancelAnimation = animate(max, newMax, transitionDuration, (newMax) => {
          max = newMax;
          render();
        });
      } else {
        render();
      }
    }

    function render () {
      const arrayOfDataArrays = config.graphNames.reduce((reduced, graphName) => [...reduced, config.data[graphName]], []);

      for (const graphName of config.graphNames) {
        clearCanvas(contexts[graphName], canvases[graphName]);
        renderPath(
          mapDataToCoords(config.data[graphName], max, { width: width * devicePixelRatio, height: height * devicePixelRatio }, viewBox),
          contexts[graphName],
        );
      }
    }

    function updateVisibilityState ({ type, graphName }) {
      if (type === EVENTS.TOGGLE_VISIBILITY_STATE) {
        canvases[graphName].classList.toggle(HIDDEN_LAYER_CLASS);
        transitionDuration = visibilityStateChangeTransitionDuration;
      }
    }

    function updateViewBoxState ({ type, viewBox: newViewBox }) {
      if (type === EVENTS.VIEW_BOX_CHANGE) {
        if ('startIndex' in newViewBox) viewBox.startIndex = newViewBox.startIndex;
        if ('endIndex' in newViewBox) viewBox.endIndex = newViewBox.endIndex;
        transitionDuration = viewBoxChangeTransitionDuration;
      }
    }
  }

  const minimalPixelsBetweenResizers = 40;
  const classes = {
    left: 'cursor-w-resize',
    right: 'cursor-e-resize',
    grabbing: 'cursor-grabbing',
  };

  function Framer (parentElement, chartConfig, onViewBoxChange) {
    const frameContainer = document.createElement('div');
    frameContainer.classList.add('overview');
    const updateFrameGraphs = Graphs(frameContainer, chartConfig, {
      width: chartConfig.FRAME_CANVAS_WIDTH,
      height: chartConfig.FRAME_CANVAS_HEIGHT,
      strokeStyles: chartConfig.colors,
      lineWidth: chartConfig.FRAME_LINE_WIDTH,
      viewBox: {
        startIndex: 0,
        endIndex: chartConfig.data.total - 1,
      }
    });
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

    return updateFrameGraphs

    function onLeftResizerMouseDown (e) {
      e.stopPropagation();
      e.preventDefault();
      document.body.classList.add(classes.left);
      frameState.cursorResizerDelta = getX(e) - (resizerLeft.getBoundingClientRect().left - frameContainer.getBoundingClientRect().left),
      document.addEventListener('mouseup', removeLeftResizerListener);
      document.addEventListener('mousemove', onLeftResizerMouseMove);
    }

    function removeLeftResizerListener () {
      document.body.classList.remove(classes.left);
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
      e.stopPropagation();
      e.preventDefault();
      document.body.classList.add(classes.right);
      frameState.cursorResizerDelta = getX(e) - (resizerRight.getBoundingClientRect().right - frameContainer.getBoundingClientRect().left),
      document.addEventListener('mouseup', removeRightResizerListener);
      document.addEventListener('mousemove', onRightResizerMouseMove);
    }

    function removeRightResizerListener () {
      document.body.classList.remove(classes.right);
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
      frameState.cursorFramerDelta = getX(e) - (framer.getBoundingClientRect().left - frameContainer.getBoundingClientRect().left),
      framer.classList.add(classes.grabbing);
      document.body.classList.add(classes.grabbing);
      document.addEventListener('mouseup', onFramerMouseUp);
      document.addEventListener('mousemove', onFramerMouseMove);
    }

    function onFramerMouseUp () {
      document.body.classList.remove(classes.grabbing);
      framer.classList.remove(classes.grabbing);
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
      // console.log(frameState.right / endIndex)
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

  function Chart (chartConfig) {
    const containerElement = document.createElement('div');
    containerElement.appendChild(Title('Followers'));
    const updateGraphs = Graphs(containerElement, chartConfig, {
      width: chartConfig.width,
      height: chartConfig.height,
      lineWidth: chartConfig.lineWidth,
      strokeStyles: chartConfig.colors,
      viewBox: chartConfig.renderWindow,
      showXAxis: true,
    });
    // const [overview, updateOverview] = Framer(chartConfig, onViewBoxChange)
    const updateFrameGraphs = Framer(containerElement, chartConfig, onViewBoxChange);
    containerElement.appendChild(Controls(chartConfig, onButtonClick));
    document.body.appendChild(containerElement);

    function onButtonClick (graphName) {
      chartConfig.visibilityState[graphName] = !chartConfig.visibilityState[graphName];
      updateGraphs({
        type: EVENTS.TOGGLE_VISIBILITY_STATE,
        graphName,
      });
      updateFrameGraphs({
        type: EVENTS.TOGGLE_VISIBILITY_STATE,
        graphName,
      });
    }

    function onViewBoxChange (viewBox) {
      updateGraphs({
        type: EVENTS.VIEW_BOX_CHANGE,
        viewBox,
      });
    }

  }

  const MODES = {
    LIGHT: 'LIGHT',
    DARK: 'DARK',
  };

  const label = {
    [MODES.LIGHT]: 'Switch to Night Mode',
    [MODES.DARK]: 'Switch to Day Mode',
  };

  const classNames = {
    [MODES.LIGHT]: 'theme-light',
    [MODES.DARK]: 'theme-dark',
  };

  function ThemeSwitcher () {
    let mode = MODES.LIGHT;

    const button = document.createElement('button');
    button.innerText = label[mode];
    button.classList.add('theme-switcher');
    button.addEventListener('click', function () {
      document.body.classList.remove(classNames[mode]);
      mode = mode === MODES.LIGHT ? MODES.DARK : MODES.LIGHT;
      button.innerText = label[mode];
      document.body.classList.add(classNames[mode]);
    });
    document.body.appendChild(button);
  }

  const LINE_WIDTH = 2;
  const FRAME_LINE_WIDTH = 1;
  const CANVAS_WIDTH = 768;
  const CANVAS_HEIGHT = 300;
  const FRAME_CANVAS_HEIGHT = 50;
  const FRAME_CANVAS_WIDTH = CANVAS_WIDTH;

  function createChartConfig (chartData) {
    const graphNames = chartData.columns
      .map(column => column[0])
      .filter(graphName => chartData.types[graphName] === 'line');
    const domain = chartData.columns.find(column => column[0] === 'x').slice(1);

    const data = chartData.columns.reduce((data, column) => ({
      ...data,
      [column[0]]: column.slice(1),
      total: Math.max(data.total, column.length - 1)
    }), {
      total: 0,
    });
    const visibilityState = graphNames.reduce((visibilityState, graphName) => ({
      ...visibilityState,
      [graphName]: true,
    }), {});
    const renderWindow = {
      startIndex: Math.ceil(data.total / 3 * 2),
      endIndex: data.total - 1,
    };

    return {
      data,
      domain,
      graphNames,
      visibilityState,
      renderWindow,
      colors: chartData.colors,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      lineWidth: LINE_WIDTH,
      FRAME_CANVAS_WIDTH,
      FRAME_CANVAS_HEIGHT,
      FRAME_LINE_WIDTH,
    }
  }

  // <script type="text/javascript" src="./js/constants.js"></script>
  // <script type="text/javascript" src="./js/util.js"></script>
  // <script type="text/javascript" src="./js/html.js"></script>
  // <script type="text/javascript" src="./js/title.js"></script>
  // <script type="text/javascript" src="./js/x-axis.js"></script>
  // <script type="text/javascript" src="./js/create-config.js"></script>
  // <script type="text/javascript" src="./js/canvas-renderer.js"></script>
  // <script type="text/javascript" src="./js/Graphs.js"></script>
  // <script type="text/javascript" src="./js/frame.js"></script>
  // <script type="text/javascript" src="./js/controls.js"></script>
  // <script type="text/javascript" src="./js/ThemeSwitcher.js"></script>
  // <script type="text/javascript" src="./js/chart.js"></script>

  exports.Chart = Chart;
  exports.ThemeSwitcher = ThemeSwitcher;
  exports.createChartConfig = createChartConfig;

  return exports;

}({}));
