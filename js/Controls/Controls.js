import { createElement } from '../html'

export function Controls (config, onButtonClick) {
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