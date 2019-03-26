(function () {
  'use strict';

  // For IE11
  Array.prototype.find = Array.prototype.find || function (predicate) {
    for (var i = 0; i < this.length; i++) {
      if (predicate(this[i], i, this)) return this[i]
    }
  };

  Object.assign = Object.assign || function (target) {
    var sources = Array.prototype.slice.call(arguments).slice(1);
    sources.forEach(function (source) {
      for (var key in source) {
        target[key] = source[key];
      }
    });
    return target
  };

  Number.isInteger = Number.isInteger || function (n) {
    return !(n % 1)
  };

  Object.values = Object.values || function (source) {
    var values = [];
    for (var key in source) {
      values.push(source[key]);
    }
    return values
  };

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const LIGHT = 0;
  const DARK = 1;

  const ELEMENT_CLASS_NAME = 'title';

  function Title (title) {
    const element = document.createElement('div');
    element.className = ELEMENT_CLASS_NAME;
    element.innerText = title;
    return element
  }

  function handleDrag (element, { onDragStart, onDragMove, onDragEnd }) {
    element.addEventListener('mousedown', onStart);
    element.addEventListener('touchstart', onStart);

    function onStart (e) {
      e.preventDefault();
      e.stopPropagation();
      switch (event.type) {
        case 'mousedown':
          if (event.which === 1) {
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onEnd);
            onDragStart(e);
          }
          break
        case 'touchstart':
          document.addEventListener('touchmove', onMove);
          document.addEventListener('touchend', onEnd);
          onDragStart(e.touches[0]);
          break;
      }
    }

    function onMove (e) {
      switch (event.type) {
        case 'mousemove':
          onDragMove(e);
          break
        case 'touchmove':
          onDragMove(e.touches[0]);
          break
      }
    }

    function onEnd (e) {
      switch (e.type) {
        case 'mouseup':
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onEnd);
          onDragEnd(e);
          break
        case 'touchend':
          document.removeEventListener('touchmove', onMove);
          document.removeEventListener('touchend', onEnd);
          onDragEnd(e.touches[0]);
          break
      }
    }
  }

  function animateValues (from, to, callback, easings, durations) {
    const startTime = Date.now();

    return animateProgress(Math.max(...Object.values(durations)), progress => {
      const currentTime = Date.now();
      const intermediateValue = {};
      for (const key in from) {
        if (durations[key] > currentTime - startTime) {
          intermediateValue[key] = easings[key]((currentTime - startTime) / durations[key]) * (to[key] - from[key]) + from[key];
        } else {
          intermediateValue[key] = to[key];
        }
      }
      callback(intermediateValue);
    })
  }

  function animateProgress (duration, callback) {
    var startTime = Date.now();
    var animating = true;
    var lastDispatchedValue;
    var animationId = requestAnimationFrame(frame);

    function frame () {
      var currentTime = Date.now();
      if (currentTime - startTime >= duration) {
        if (lastDispatchedValue !== 1) {
          callback(1);
        }
        animating = false;
      } else {
        callback(lastDispatchedValue = (currentTime - startTime) / duration);
        animationId = requestAnimationFrame(frame);
      }
    }

    return function cancelAnimation () {
      if (animating) {
        animating = false;
        var currentTime = Date.now();
        if (lastDispatchedValue !== 1) {
          callback((currentTime - startTime) / duration);
        }
        cancelAnimationFrame(animationId);
      }
    }
  }

  function getShortNumber (num) {
    if (Math.abs(num) < 1000) {
      return num
    }

    var shortNumber;
    var exponent;
    var size;
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

    for (var suffix in suffixes) {
      if (exponent < suffixes[suffix]) {
        shortNumber += suffix;
        break
      }
    }

    return shortNumber
  }

  const { max, min, ceil, floor, pow } = Math;

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

  // h = H * w / W
  // O(n)
  function mapDataToCoords (data, max, { width, height: availableHeight }, { startIndex, endIndex }, lineWidth) {
    const height = availableHeight - lineWidth * 2;
    const coords = [];

    if (!Number.isInteger(startIndex)) {
      coords.push({
        x: 0,
        y: height - height / max * interpolatePoint(startIndex, data),
      });
    }

    // In case there is more data than pixels
    // we will aggregate data so that there is only
    // one point per pixel
    const step = (endIndex - startIndex) / width > 1.5 ? (endIndex - startIndex) / width : 1;
    for (let i = ceil(startIndex); i <= floor(endIndex); i += step) {
      coords.push({
        x: width / (endIndex - startIndex) * (i - startIndex),
        y: lineWidth + height - height / max * interpolatePoint(i, data),
      });
    }

    if (!Number.isInteger(endIndex)) {
      coords.push({
        x: width,
        y: height - height / max * interpolatePoint(endIndex, data),
      });
    }
    return coords
  }

  function calculateOrderOfMagnitude (n) {
    const order = Math.floor(Math.log(n) / Math.LN10 + 0.000000001);
    return Math.pow(10, order)
  }

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

  function getMaxValue (viewBox, values) {
    return beautifyNumber(findMaxElement(values, viewBox))
  }

  function beautifyNumber (number) {
    const magnitude = calculateOrderOfMagnitude(number);
    if (number % magnitude === 0) return number
    if (number % (magnitude / 2) === 0) return number
    return number + ((magnitude / 2) - number % (magnitude / 2))
  }

  function getMinValue ({ startIndex, endIndex }, values) {
    let minValue = values[0][ceil(startIndex)];
    for (let j = 0; j < values.length; j++) {
      minValue = min(minValue, interpolatePoint(startIndex, values[j]), interpolatePoint(endIndex, values[j]));
      for (let i = ceil(startIndex); i <= endIndex; i++) {
        minValue = min(values[j][i], minValue);
      }
    }
    return beautifyNumber(minValue)
  }

  function calculateLogScaleMultiplier (n) {
    for (let i = 3; i < 50; i++) {
      if (n < Math.pow(2, i)) return i - 3
    }
  }

  function createElement (type, attributes = {}, children = []) {
    const element = document.createElement(type);
    Object.assign(element, attributes);
    children.forEach(child => element.appendChild(child));
    return element
  }

  const div = () => document.createElement('div');

  const LEGEND_ITEM_CLASS = 'legend-item-value';
  const LEGEND_ITEM_HIDDEN_CLASS = 'legend-item-value--hidden';
  const APPROX_LABEL_WIDTH = 40;

  function XAxis ({ points, viewBox, width }) {
    const element = div();
    element.className = 'x-axis';
    element.style.width = `${width}px`;
    const shiftingContainer = div();
    shiftingContainer.className = 'shifting-container';
    element.appendChild(shiftingContainer);
    const legendValues = [];
    const valuesWidths = [];
    const visibilityState = {};
    const scheduledToHide = {};

    shiftingContainer.addEventListener('transitionend', onTransitionEnd);

    for (let i = 0; i < points.length; i++) {
      const xValueElement = div();
      xValueElement.innerText = points[i].label;
      xValueElement.className = LEGEND_ITEM_CLASS;
      legendValues.push(xValueElement);
      shiftingContainer.appendChild(xValueElement);
    }

    setViewBox(viewBox);

    return { element, setViewBox }

    function onTransitionEnd (e) {
      const elementIndex = legendValues.indexOf(e.target);
      scheduledToHide[elementIndex] = false;
    }

    function setViewBox (viewBox) {
      const stepMiltiplier = calculateLogScaleMultiplier(viewBox.endIndex - viewBox.startIndex) + Number(width <= 400);
      const xScale = (viewBox.endIndex - viewBox.startIndex) / (points.length - 1);
      const shift = -1 / xScale * width * viewBox.startIndex / (points.length - 1);
      shiftingContainer.style.transform = `translateX(${shift.toFixed(1)}px)`;
      for (let i = 0; i < points.length; i++) {
        const xValueElement = legendValues[i];
        const offset = points[i].x / xScale;

        if (!valuesWidths[i]) {
          valuesWidths[i] = xValueElement.offsetWidth;
        }

        // Can be calculated based on viewBox indexes
        // instead of geometry
        const visible = !(
          i % pow(2, stepMiltiplier)
          || (offset < -1 * shift)
          || ((valuesWidths[i] || APPROX_LABEL_WIDTH) + offset + shift > width)
        );

        if (visibilityState[i] !== visible) {
          if (visible) {
            scheduledToHide[i] = false;
            visibilityState[i] = true;
            xValueElement.classList.remove(LEGEND_ITEM_HIDDEN_CLASS);
          } else {
            if (i in scheduledToHide) {
              scheduledToHide[i] = true;
            } else {
              scheduledToHide[i] = false;
            }
            visibilityState[i] = false;
            xValueElement.classList.add(LEGEND_ITEM_HIDDEN_CLASS);
          }
        }

        if (visible || scheduledToHide[i]) {
          xValueElement.style.transform = `translateX(${offset.toFixed(1)}px)`;
        }
      }
    }
  }

  const CLASS = 'y-axis-line';
  const NUMBER_CLASS = 'y-axis-number';
  const STEP_COUNT = 4;
  const NUMBER_VERTICAL_PADDING = 5;
  const NUMBER_VERTICAL_SPACE = 18;

  function YAxis (max, min, height) {
    const element = document.createDocumentFragment();
    const elements = [];

    const totalStepCount = max / min * STEP_COUNT;
    const step = height / totalStepCount;
    for (let i = 0; i < totalStepCount; i++) {
      const line = document.createElement('div');
      line.className = CLASS;

      const number = document.createElement('div');
      number.className = NUMBER_CLASS;
      number.innerText = getShortNumber(Math.round(max / totalStepCount * i));
      elements.push({
        line: line,
        number: number,
        bottom: step * i,
      });

      element.appendChild(number);
      element.appendChild(line);
    }

    setMax(max);

    return { element, setMax }

    // This function need to be optimized for data with big range of values
    function setMax (newMax) {
      const numberOfVisibleSteps = elements.reduce(
        (total, element) => total + (max / newMax * element.bottom + NUMBER_VERTICAL_PADDING + NUMBER_VERTICAL_SPACE <= height),
        0,
      );
      const multilplier = calculateLogScaleMultiplier(numberOfVisibleSteps) + Number(height <= 250);
      elements.forEach((element, index) => {
        const y = max / newMax * element.bottom;

        element.line.style.transform = `translateY(${-1 * y}px)`;
        element.number.style.transform = `translateY(${-1 * (y + NUMBER_VERTICAL_PADDING)}px)`;
        const isVisible = y + NUMBER_VERTICAL_PADDING + NUMBER_VERTICAL_SPACE <= height && !(index % Math.pow(2, multilplier));
        if (isVisible) {
          element.line.style.opacity = 1;
          element.number.style.opacity = 1;
        } else {
          element.line.style.opacity = 0;
          element.number.style.opacity = 0;
        }
      });
    }
  }

  const TOGGLE_VISIBILITY_STATE = 0;
  const VIEW_BOX_CHANGE = 1;

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
      element.style.transform = `translateX(${x - element.offsetWidth / 2}px)`;
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
        tooltipValues[graphName].innerText = getShortNumber(value[graphName]);
      }
    }
  }

  function getTooltipDateText (timestamp) {
    const date = new Date(timestamp);
    return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`
  }

  const DOT_BORDER_SIZE = 2;
  const DOT_SIZE = 10;
  const CENTER_OFFSET = - DOT_SIZE / 2 - DOT_BORDER_SIZE;

  function TooltipCircle ({ color }) {
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
      element.style.transform = `translateX(${x + CENTER_OFFSET}px) translateY(${y + CENTER_OFFSET}px)`;
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

  const CLASS_NAME = 'graph';
  const HIDDEN_LAYER_CLASS = 'graph--hidden';

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
    element.className = CLASS_NAME;

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

  function EmptyState () {
    const element = document.createElement('div');
    element.className = 'empty-state';
    element.innerText = 'Nothing to show';
    element.style.opacity = 0;

    return { element, setVisibile }

    function setVisibile (visible) {
      element.style.opacity = visible ? 0 : 1;
    }
  }

  const TRANSITION_DURATIONS = {
    [VIEW_BOX_CHANGE]: 80,
    [TOGGLE_VISIBILITY_STATE]: 200,
  };

  // graphNames, colors, visibilityStte, data
  function Graphs (config, {
    width,
    height,
    lineWidth,
    strokeStyles,
    viewBox: { startIndex, endIndex },
    showXAxis,
    showYAxis,
    showTooltip,
    top,
  }) {
    const element = document.createDocumentFragment();
    const canvasesContainer = div();
    const viewBox = {
      startIndex,
      endIndex,
    };
    let max = getMaxValue(viewBox, getArrayOfDataArrays(config.graphNames));
    let min = getMinValue({ startIndex: 0, endIndex: config.data.total - 1 }, getArrayOfDataArrays(config.graphNames));
    let yAxis;
    if (showYAxis) {
      yAxis = YAxis(max, min, height);
      canvasesContainer.appendChild(yAxis.element);
    }

    canvasesContainer.style.width = `${width}px`;
    canvasesContainer.style.height = `${height}px`;
    canvasesContainer.className = 'graphs';
    if (top) canvasesContainer.style.top = `${top}px`;

    const canvases = {};
    for (let i = 0; i < config.graphNames.length; i++) {
      const graph = Graph({ width, height, lineWidth, strokeStyle: strokeStyles[config.graphNames[i]] });
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
    const emprtState = EmptyState();
    canvasesContainer.appendChild(emprtState.element);
    element.appendChild(canvasesContainer);

    let dragging = false;
    let cancelAnimation;
    let transitionDuration;
    let xAxis;
    let currentState = {
      startIndex,
      endIndex,
      max,
    };

    if (showXAxis) {
      xAxis = XAxis({
        points: getXAxisPoints(),
        viewBox,
        width,
      });
      element.appendChild(xAxis.element);
    }

    render(currentState);

    return {
      element,
      changeViewBox,
      toggleVisibility,
      startDrag,
      stopDrag,
    }

    function update () {
      const visibleGraphNames = config.graphNames.filter(graphName => config.visibilityState[graphName]);
      if (!visibleGraphNames.length) return
      const arrayOfDataArrays = getArrayOfDataArrays(visibleGraphNames);
      const newMax = getMaxValue(viewBox, arrayOfDataArrays);
      if (cancelAnimation) cancelAnimation();
      cancelAnimation = animateValues(currentState, { ...viewBox, max: newMax }, updateStateAndRender,
        { startIndex: t => t, endIndex: t => t, max: t => t },
        { startIndex: 64, endIndex: 64, max: transitionDuration },
      );
    }

    function updateStateAndRender (state) {
      render(currentState = state);
    }

    // function setYScale (yScale) {}

    // function setViewBox (viewBox) {}

    // yScale
    function render ({ max, startIndex, endIndex }) {
      if (xAxis) xAxis.setViewBox({ startIndex, endIndex });
      if (yAxis) yAxis.setMax(max);
      for (let i = 0; i < config.graphNames.length; i++) {
        const graphName = config.graphNames[i];
        canvases[graphName].clear();
        canvases[graphName].renderPath(
          mapDataToCoords(
            config.data[graphName],
            max,
            { width: width * devicePixelRatio, height: height * devicePixelRatio },
            { startIndex, endIndex },
            lineWidth,
          )
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
        { width: width * devicePixelRatio, height: height * devicePixelRatio },
        viewBox,
        lineWidth,
      );
      const newLeft = (e.clientX - canvasesContainer.getBoundingClientRect().left) * devicePixelRatio;

      let closestPointIndex = 0;
      for (let i = 1; i < coords.length; i++) {
        if (Math.abs(newLeft - coords[i].x) < Math.abs(newLeft - coords[closestPointIndex].x)) closestPointIndex = i;
      }

      const values = {};
      for (let i = 0; i < visibleGraphNames.length; i++) {
        const graphName = visibleGraphNames[i];

        const thisCoords = mapDataToCoords(
          config.data[graphName],
          max,
          { width: width * devicePixelRatio, height: height * devicePixelRatio },
          viewBox,
          lineWidth,
        );
        tooltipDots[graphName].show();
        // xShift can be calculated once for all points
        const x = thisCoords[closestPointIndex].x / devicePixelRatio;
        const y = thisCoords[closestPointIndex].y / devicePixelRatio;
        tooltipDots[visibleGraphNames[i]].setPosition({ x, y });

        tooltip.show();
        tooltip.setPosition(x);
        const dataIndex = closestPointIndex + Math.floor(viewBox.startIndex);
        tooltip.setDate(config.domain[dataIndex]);
        values[graphName] = config.data[graphName][dataIndex];
      }
      tooltip.showValues(values);
      tooltipLine.setPosition(coords[closestPointIndex].x / devicePixelRatio);
    }

    function onContainerMouseOut () {
      tooltipLine.hide();
      tooltip.hide();
      Object.values(tooltipDots).forEach(dot => dot.hide());
    }

    function toggleVisibility (graphName) {
      canvases[graphName].toggleVisibility();
      const visibleGraphNames = config.graphNames.filter(graphName => config.visibilityState[graphName]);
      emprtState.setVisibile(visibleGraphNames.length);
      transitionDuration = TRANSITION_DURATIONS[TOGGLE_VISIBILITY_STATE];
      update();
    }

    function changeViewBox (newViewBox) {
      Object.assign(viewBox, newViewBox);
      transitionDuration = TRANSITION_DURATIONS[VIEW_BOX_CHANGE];
      update();
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
      tooltip.hide();
      tooltipLine.hide();
      for (let i = 0; i < config.graphNames.length; i++) {
        tooltipDots[config.graphNames[i]].hide();
      }
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
  const ELEMENT_CLASS_NAME$1 = 'overview';
  const VIEWBOX_TOP_BOTTOM_BORDER_WIDTH = 4;

  function Overview (chartConfig, onViewBoxChange, onDragStart, onDragEnd) {
    const overviewContainer = div();
    overviewContainer.className = ELEMENT_CLASS_NAME$1;
    overviewContainer.style.height = `${chartConfig.OVERVIEW_CANVAS_HEIGHT}px`;
    overviewContainer.style.width = `${chartConfig.OVERVIEW_CANVAS_WIDTH}px`;

    const graphs = Graphs(chartConfig, {
      width: chartConfig.OVERVIEW_CANVAS_WIDTH,
      height: chartConfig.OVERVIEW_CANVAS_HEIGHT - VIEWBOX_TOP_BOTTOM_BORDER_WIDTH * 2,
      top: VIEWBOX_TOP_BOTTOM_BORDER_WIDTH,
      strokeStyles: chartConfig.colors,
      lineWidth: chartConfig.OVERVIEW_LINE_WIDTH,
      viewBox: {
        startIndex: 0,
        endIndex: chartConfig.data.total - 1,
      },
    });
    overviewContainer.appendChild(graphs.element);
    const backgroundLeft = createElement('div', { className: 'overview__overflow overview__overflow--left' });
    const backgroundRight = createElement('div', { className: 'overview__overflow overview__overflow--right' });
    const resizerLeft = createElement('div', { className: 'overview__resizer overview__resizer--left' });
    const resizerRight = createElement('div', { className: 'overview__resizer overview__resizer--right' });
    const viewBoxElement = createElement('div', { className: 'overview__viewbox' }, [resizerLeft, resizerRight]);
    overviewContainer.appendChild(backgroundLeft);
    overviewContainer.appendChild(backgroundRight);
    overviewContainer.appendChild(viewBoxElement);

    const overviewState = {
      left: chartConfig.viewBox.startIndex / (chartConfig.data.total - 1) * chartConfig.OVERVIEW_CANVAS_WIDTH,
      right: chartConfig.OVERVIEW_CANVAS_WIDTH,
      cursorResizerDelta: 0,
      cursorViewBoxElementDelta: 0,
    };

    backgroundLeft.style.width = `${overviewState.left}px`;
    viewBoxElement.style.left = `${overviewState.left}px`;

    handleDrag(resizerLeft, {
      onDragStart: onLeftResizerMouseDown,
      onDragMove: onLeftResizerMouseMove,
      onDragEnd: removeLeftResizerListener,
    });
    handleDrag(resizerRight, {
      onDragStart: onRightResizerMouseDown,
      onDragMove: onRightResizerMouseMove,
      onDragEnd: removeRightResizerListener,
    });
    handleDrag(viewBoxElement, {
      onDragStart: onViewBoxElementMouseDown,
      onDragMove: onViewBoxElementMouseMove,
      onDragEnd: onViewBoxElementMouseUp,
    });

    return {
      element: overviewContainer,
      toggleVisibility: graphs.toggleVisibility,
    }

    function onLeftResizerMouseDown (e) {
      onDragStart();
      document.body.classList.add(classes.left);
      viewBoxElement.classList.add(classes.left);
      overviewState.cursorResizerDelta = getX(e) - (resizerLeft.getBoundingClientRect().left - overviewContainer.getBoundingClientRect().left);
    }

    function removeLeftResizerListener () {
      onDragEnd();
      document.body.classList.remove(classes.left);
      viewBoxElement.classList.remove(classes.left);
    }

    function onLeftResizerMouseMove (e) {
      const left = ensureInOverviewBounds(getX(e) - overviewState.cursorResizerDelta);
      overviewState.left = left > overviewState.right - minimalPixelsBetweenResizers ? (overviewState.right - minimalPixelsBetweenResizers) : left;
      backgroundLeft.style.width = `${overviewState.left}px`;
      viewBoxElement.style.left = `${overviewState.left}px`;
      const startIndex = overviewState.left / chartConfig.OVERVIEW_CANVAS_WIDTH * (chartConfig.data.total - 1);
      onViewBoxChange({ startIndex });
    }

    function onRightResizerMouseDown (e) {
      onDragStart();
      document.body.classList.add(classes.right);
      viewBoxElement.classList.add(classes.right);
      overviewState.cursorResizerDelta = getX(e) - (resizerRight.getBoundingClientRect().right - overviewContainer.getBoundingClientRect().left);
    }

    function removeRightResizerListener () {
      onDragEnd();
      document.body.classList.remove(classes.right);
      viewBoxElement.classList.remove(classes.right);
    }

    function onRightResizerMouseMove (e) {
      const right = ensureInOverviewBounds(getX(e) - overviewState.cursorResizerDelta);
      overviewState.right = right < overviewState.left + minimalPixelsBetweenResizers ? (overviewState.left + minimalPixelsBetweenResizers) : right;
      backgroundRight.style.left = `${overviewState.right}px`;
      viewBoxElement.style.right = `${chartConfig.OVERVIEW_CANVAS_WIDTH - (overviewState.right)}px`;
      const endIndex = (overviewState.right) / chartConfig.OVERVIEW_CANVAS_WIDTH * (chartConfig.data.total - 1);
      onViewBoxChange({ endIndex });
    }

    function getX (event) {
      const { left } = overviewContainer.getBoundingClientRect();
      return event.clientX - left
    }

    function ensureInOverviewBounds (x) {
      if (x > chartConfig.OVERVIEW_CANVAS_WIDTH) return chartConfig.OVERVIEW_CANVAS_WIDTH
      if (x < 0) return 0
      return x
    }

    function onViewBoxElementMouseDown (e) {
      onDragStart();
      overviewState.cursorViewBoxElementDelta = getX(e) - (viewBoxElement.getBoundingClientRect().left - overviewContainer.getBoundingClientRect().left),
      viewBoxElement.classList.add(classes.grabbing);
      document.body.classList.add(classes.grabbing);
      resizerLeft.classList.add(classes.grabbing);
      resizerRight.classList.add(classes.grabbing);
    }

    function onViewBoxElementMouseUp () {
      onDragEnd();
      document.body.classList.remove(classes.grabbing);
      viewBoxElement.classList.remove(classes.grabbing);
      resizerLeft.classList.remove(classes.grabbing);
      resizerRight.classList.remove(classes.grabbing);
    }

    function onViewBoxElementMouseMove (e) {
      const width = overviewState.right - overviewState.left;
      const nextLeft = getX(e) - overviewState.cursorViewBoxElementDelta;
      if (nextLeft < 0) {
        overviewState.left = 0;
      } else if (nextLeft > chartConfig.OVERVIEW_CANVAS_WIDTH - width) {
        overviewState.left = chartConfig.OVERVIEW_CANVAS_WIDTH - width;
      } else {
        overviewState.left = nextLeft;
      }
      overviewState.right = overviewState.left + width;
      viewBoxElement.style.left = `${overviewState.left}px`;
      viewBoxElement.style.right = `${chartConfig.OVERVIEW_CANVAS_WIDTH - (overviewState.right)}px`;
      backgroundLeft.style.width = `${overviewState.left}px`;
      backgroundRight.style.left = `${overviewState.right}px`;
      const startIndex = overviewState.left / chartConfig.OVERVIEW_CANVAS_WIDTH * (chartConfig.data.total - 1);
      const endIndex = (overviewState.right) / (chartConfig.OVERVIEW_CANVAS_WIDTH) * (chartConfig.data.total - 1);
      onViewBoxChange({ startIndex, endIndex });
    }
  }

  function Controls (config, onButtonClick) {
    const element = document.createElement('div');
    element.style.marginTop = '20px';

    config.graphNames.forEach(graphName => {
      const label = document.createElement('label');
      label.style.marginRight = '20px';

      const input = document.createElement('input');
      input.checked = true;
      input.type = 'checkbox';
      input.className = 'button';
      input.onclick = () => onButtonClick(graphName);

      const button = document.createElement('div');
      button.className = 'like-button';
      button.style.color = config.colors[graphName];

      const text = document.createElement('div');
      text.className = 'button-text';
      text.innerText = graphName;

      button.appendChild(text);
      label.appendChild(input);
      label.appendChild(button);
      element.appendChild(label);
    });

    return element
  }

  function Chart (chartConfig) {
    const element = document.createElement('div');
    element.style.marginTop = '110px';
    element.appendChild(Title(chartConfig.title));
    const graphs = Graphs(chartConfig, {
      width: chartConfig.width,
      height: chartConfig.height,
      lineWidth: chartConfig.lineWidth,
      strokeStyles: chartConfig.colors,
      viewBox: chartConfig.viewBox,
      showXAxis: true,
      showYAxis: true,
      showTooltip: true,

      // colors: chartConfig.colors,
      // graphNames: chartConfig.graphNames,
      // data: chartConfig.data,
      // domain: chartConfig.domain,
      // visibleGraphNames: get ()
      // maxVisibleValue: get ()
    });

    const overview = Overview(chartConfig, onViewBoxChange, onDragStart, onDragEnd);
    element.appendChild(graphs.element);
    element.appendChild(overview.element);
    element.appendChild(Controls(chartConfig, onButtonClick));

    return { element }

    function onButtonClick (graphName) {
      chartConfig.visibilityState[graphName] = !chartConfig.visibilityState[graphName];
      graphs.toggleVisibility(graphName);
      overview.toggleVisibility(graphName);
    }

    function onViewBoxChange (viewBox) {
      graphs.changeViewBox(viewBox);
    }

    function onDragStart () {
      graphs.startDrag();
    }

    function onDragEnd () {
      graphs.stopDrag();
    }
  }

  const NEXT_THEME = {
    [LIGHT]: DARK,
    [DARK]: LIGHT,
  };

  const LABELS = {
    [LIGHT]: 'Switch to Night Mode',
    [DARK]: 'Switch to Day Mode',
  };

  const THEME_CLASS_NAMES = {
    [LIGHT]: 'theme-light',
    [DARK]: 'theme-dark',
  };

  const ELEMENT_CLASS_NAME$2 = 'theme-switcher';

  function ThemeSwitcher (initialTheme) {
    let theme = initialTheme;

    const button = document.createElement('button');
    button.innerText = LABELS[theme];
    button.classList.add(ELEMENT_CLASS_NAME$2);
    button.addEventListener('click', function () {
      document.body.classList.remove(THEME_CLASS_NAMES[theme]);
      theme = NEXT_THEME[theme];
      button.innerText = LABELS[theme];
      document.body.classList.add(THEME_CLASS_NAMES[theme]);
    });

    return button
  }

  const LINE_WIDTH$1 = 2;
  const OVERVIEW_LINE_WIDTH = 1;
  // Change here to test mobile screens
  const CANVAS_WIDTH = 768;
  const CANVAS_HEIGHT = 300;
  const OVERVIEW_CANVAS_HEIGHT = 50;
  const OVERVIEW_CANVAS_WIDTH = CANVAS_WIDTH;

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
    const viewBox = {
      startIndex: ceil(data.total / 3 * 2),
      endIndex: data.total - 1,
    };

    return {
      title: 'Followers',
      data,
      domain,
      graphNames,
      visibilityState,
      viewBox,
      colors: chartData['colors'],
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      lineWidth: LINE_WIDTH$1,
      OVERVIEW_CANVAS_WIDTH,
      OVERVIEW_CANVAS_HEIGHT,
      OVERVIEW_LINE_WIDTH,
    }
  }

  document.body.appendChild(ThemeSwitcher(DARK));

  // 1/3, 1/2, 1/3, 1/3, 1/2
  // Chart(createChartConfig(chartData[0]))
  chartData
    .map(data => Chart(createChartConfig(data)))
    .forEach(chart => document.body.appendChild(chart.element));

}());
