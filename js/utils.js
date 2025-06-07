const $ = id => document.getElementById(id);

const fillSelect = (selectElement, optionsArray, includeDefault = false, defaultValue = "Todos", defaultText = "Todos") => {
  selectElement.innerHTML = "";
  if (includeDefault) {
    selectElement.add(new Option(defaultText, defaultValue));
  }
  optionsArray.forEach(optionValue => {
    // If optionValue is an object like {value: 'val', text: 'Display'}, use it
    if (typeof optionValue === 'object' && optionValue !== null && 'value' in optionValue && 'text' in optionValue) {
      selectElement.add(new Option(optionValue.text, optionValue.value));
    } else { // Otherwise, assume it's a simple value for both text and value
      selectElement.add(new Option(optionValue, optionValue));
    }
  });
};

const createAndAppendElement = (parent, tagName, options = {}) => {
  const el = document.createElement(tagName);
  Object.entries(options).forEach(([key, value]) => {
    if (key === 'textContent') {
      el.textContent = value;
    } else if (key === 'innerHTML') {
      el.innerHTML = value;
    } else if (key === 'className') { // Allow multiple classes via string
        el.className = value;
    }
    else {
      el.setAttribute(key, value);
    }
  });
  parent.appendChild(el);
  return el;
};

const sanitizeText = (text) => {
    const tempDiv = document.createElement('div');
    tempDiv.textContent = text;
    return tempDiv.innerHTML;
}