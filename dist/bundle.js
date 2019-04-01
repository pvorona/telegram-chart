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

  const linear = t => t;
  function easing (t) {
    return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  function animate (from, to, duration, easing, callback) {
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
        const currentTime = Date.now();
        callback(easing(
          (currentTime - startAnimationTime) / duration
        ) * (to - from) + from);
        cancelAnimationFrame(animationId);
      }
    }
  }

  function createTransitionGroup (initialValues, durations, easings, onTick) {
    const currentState = { ...initialValues };
    const currentTargets = { ...initialValues };
    const animations = {};

    const setTargets = (targets) => {
      for (let key in targets) {
        const value = targets[key];

        if (currentTargets[key] === value || currentState[key] === value) {
          continue
        }

        currentTargets[key] = value;

        if (animations[key]) {
          animations[key]();
        }
        animations[key] = animate(currentState[key], value, durations[key], easings[key], (newValue) => {
          currentState[key] = newValue;
          onTick(currentState);
        });
      }
    };

    return { setTargets }
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

  // export * from './memoizeOne'

  function createElement (type, attributes = {}, children = []) {
    const element = document.createElement(type);
    Object.assign(element, attributes);
    children.forEach(child => element.appendChild(child));
    return element
  }

  const div = () => document.createElement('div');

  function Graph ({
    context,
    strokeStyle,
    lineWidth,
    data,
  }) {
    return { render, toggleVisibility }

    function render ({ startIndex, endIndex, max, opacity }) {
      setupContext();
      renderPath(
        mapDataToCoords(
          data,
          max,
          { width: context.canvas.width, height: context.canvas.height },
          { startIndex, endIndex },
          lineWidth,
        )
      );
    }

    function toggleVisibility () {

    }

    function setupContext () {
      context.strokeStyle = strokeStyle;
      context.lineWidth = lineWidth * devicePixelRatio;
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

  const FRAME = 1000 / 60;
  const CLASS_NAME = 'graph';

  function Graphs (config, {
    width,
    height,
    lineWidth,
    strokeStyles,
    viewBox: { startIndex, endIndex },
  }) {
    const { element, graphs, context } = createDOM();
    const currentState = getInitialState();
    const transitions = createTransitionGroup(currentState, {
      startIndex: FRAME * 4,
      endIndex: FRAME * 4,
      max: FRAME * 10,
    }, {
      startIndex: linear,
      endIndex: linear,
      max: easing,
    }, render);
    render(currentState);

    return {
      element,
      setState,
    }

    function setState (state) {
      Object.assign(currentState, state);
      transitions.setTargets({
        max: getMaxGraphValue(currentState.startIndex, currentState.endIndex),
        startIndex: currentState.startIndex,
        endIndex: currentState.endIndex,
      });
    }

    function getMaxGraphValue (startIndex, endIndex) {
      return getMaxValue(
        { startIndex, endIndex },
        getDataArrays(config.graphNames),
      )
    }

    function render ({ startIndex, endIndex, max, width, height }) {
      context.clearRect(0, 0, width, height);
      graphs.forEach(graph =>
        graph.render({ startIndex, endIndex, max })
      );
    }

    function getDataArrays (graphNames) {
      return graphNames.map(graphName => config.data[graphName])
    }

    function getInitialState () {
      return {
        startIndex,
        endIndex,
        width: width * devicePixelRatio,
        height: height * devicePixelRatio,
        max: getMaxGraphValue(startIndex, endIndex),
      }
    }

    function createDOM () {
      const element = document.createDocumentFragment();
      const canvasesContainer = document.createElement('div');
      canvasesContainer.style.width = `${width}px`;
      canvasesContainer.style.height = `${height}px`;
      canvasesContainer.className = 'graphs';
      if (top) canvasesContainer.style.top = `${top}px`;

      const context = setupCanvas({
        width,
        height,
      });
      canvasesContainer.appendChild(context.canvas);
      const graphsByName = {};
      const graphs = config.graphNames.map(graphName =>
        graphsByName[graphName] = Graph({
          context,
          lineWidth,
          data: config.data[graphName],
          strokeStyle: strokeStyles[graphName],
        })
      );
      element.appendChild(canvasesContainer);

      return { element, graphs, context }
    }
  }

  function setupCanvas ({ width, height, lineWidth, strokeStyle }) {
    const element = document.createElement('canvas');
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.width = width * devicePixelRatio;
    element.height = height * devicePixelRatio;
    element.className = CLASS_NAME;

    return element.getContext('2d')
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
    const resizerLeft = createElement('div', { className: 'overview__resizer overview__resizer--left' });
    const resizerRight = createElement('div', { className: 'overview__resizer overview__resizer--right' });
    const viewBoxElement = createElement('div', { className: 'overview__viewbox' }, [resizerLeft, resizerRight]);
    overviewContainer.appendChild(viewBoxElement);

    const overviewState = {
      left: chartConfig.viewBox.startIndex / (chartConfig.data.total - 1) * chartConfig.OVERVIEW_CANVAS_WIDTH,
      right: chartConfig.OVERVIEW_CANVAS_WIDTH,
      cursorResizerDelta: 0,
      cursorViewBoxElementDelta: 0,
    };

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
      overview.toggleVisibility(graphName);
    }

    function onViewBoxChange (viewBox) {
      graphs.setState(viewBox);
    }

    function onDragStart () {
      // graphs.startDrag()
    }

    function onDragEnd () {
      // graphs.stopDrag()
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

  const LINE_WIDTH = 2;
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
      lineWidth: LINE_WIDTH,
      OVERVIEW_CANVAS_WIDTH,
      OVERVIEW_CANVAS_HEIGHT,
      OVERVIEW_LINE_WIDTH,
      get visibleGraphNames () {
        return this.graphNames.filter(graphName => this.visibilityState[graphName])
      }
    }
  }

  document.body.appendChild(ThemeSwitcher(DARK));

  // 1/3, 1/2, 1/3, 1/3, 1/2
  // Chart(createChartConfig(chartData[0]))
  chartData
    .map(data => Chart(createChartConfig(data)))
    .forEach(chart => document.body.appendChild(chart.element));

}());
