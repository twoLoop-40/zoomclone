function getInputValues(...inputs) {
  return inputs.map((input) => input.value);
}

function regExpReplaceToNone(regExp, str) {
  const reg = regExp.exec(str);
  return reg ? str.replace(reg[0], "") : str;
}

function toggleShow(...elems) {
  elems.forEach((elem) => {
    elem.hidden = !elem.hidden;
  });
}

function setInnerHTML(elem) {
  return (html) => {
    elem.innerHTML = html;
  };
}

function getTextValue(elem) {
  return elem.innerText;
}

function setInputValue(input) {
  return (value) => {
    input.value = value;
  };
}

function makeMessage(type, payload) {
  return JSON.stringify({ type, payload });
}

export {
  getInputValues,
  regExpReplaceToNone,
  toggleShow,
  setInnerHTML,
  getTextValue,
  setInputValue,
  makeMessage,
};
