export function Controls (config, onButtonClick) {
  const element = document.createElement('div')
  element.style.marginTop = '20px'

  config.graphNames.forEach(graphName => {
    const label = document.createElement('label')
    label.style.marginRight = '20px'

    const input = document.createElement('input')
    input.checked = true
    input.type = 'checkbox'
    input.className = 'button'
    input.onclick = () => onButtonClick(graphName)

    const button = document.createElement('div')
    button.className = 'like-button'
    button.style.color = config.colors[graphName]

    const text = document.createElement('div')
    text.className = 'button-text'
    text.innerText = graphName

    button.appendChild(text)
    label.appendChild(input)
    label.appendChild(button)
    element.appendChild(label)
  })

  return element
}