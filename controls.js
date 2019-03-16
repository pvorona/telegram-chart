const Controls = ({ graphNames, colors, toggleVisibilityState }) =>
  div(
    graphNames.map(graphName =>
      label({ style: `color: ${colors[graphName]}` },
        input({
          checked: true,
          type: 'checkbox',
          className: 'button',
          onclick: () => toggleVisibilityState(graphName),
        }),
        div({ className: 'like-button' },
          div({ className: 'button-text', innerText: graphName })
        )
      )
    )
  )
