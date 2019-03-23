import { createElement } from '../html'
import { TOGGLE_VISIBILITY_STATE } from '../events'

export function Controls (config, eventChannel) {
  return createElement('div', { style: 'margin-top: 20px'}, config.graphNames.map(graphName =>
    createElement('label', { style: `color: ${config.colors[graphName]}; margin-right: 20px` }, [
      createElement('input', {
        checked: true,
        type: 'checkbox',
        className: 'button',
        onclick: () => eventChannel.publish(TOGGLE_VISIBILITY_STATE, graphName),
      }),
      createElement('div', { className: 'like-button' }, [
        createElement('div', { className: 'button-text', innerText: graphName })
      ])
    ])
  ))
}