let isFromEnabled = false;
let isAutoCompleteSelected = false;
let suggestionIndex = 0;
let suggestions = [];
const form = document.querySelector('form[aria-label="Search Twitter"]');
const input = form.querySelector("input[aria-label='Search query']");

const tag = document.createElement('span');
tag.innerText = 'from:';
tag.style.display = 'none';
tag.style.padding = '2px 6px';
tag.style.margin = '10px -6px 10px 0';
tag.style.borderRadius = '8px';
tag.style.backgroundColor = 'rgb(29, 155, 240)';
tag.style.color = 'white';
input.parentElement.insertBefore(tag, input);

const wow = input.cloneNode(true);
input.style.display = 'none';
input.parentElement.insertBefore(wow, input);

const target = input.cloneNode(true);

let usernames = [];

const getThemeColor = () => {
  // assume focus on search input
  return window.getComputedStyle(
    document.querySelector('div[role="button"][aria-label="Clear"]'),
  ).backgroundColor;
};
const getNeturalColor = () => {
  const theme = document.querySelector('meta[name="theme-color"]').content;
  return {
    // light
    '#FFFFFF': 'rgb(83, 100, 113)',
    // dim
    '#15202B': 'rgb(139, 152, 165)',
    // lights out
    '#000000': 'rgb(113, 118, 123)',
  }[theme];
};
const getSelectedColor = () => {
  const theme = document.querySelector('meta[name="theme-color"]').content;
  return {
    // light
    '#FFFFFF': 'rgb(247, 249, 249)',
    // dim
    '#15202B': 'rgb(30, 39, 50)',
    // lights out
    '#000000': 'rgb(22, 24, 28)',
  }[theme];
};

const mockEvent = (type) => {
  let ev = new CustomEvent(type, { bubbles: true });
  Object.defineProperty(ev, 'target', { writable: false, value: target });
  Object.defineProperty(ev, 'currentTarget', {
    writable: false,
    value: target,
  });
  return ev;
};

const update = (value, currentKey = '') => {
  wow.value = value;

  // In `from:` search, add `:` to only include users to result
  if (isFromEnabled && value.length > 0 && !value.startsWith(':')) {
    target.value = ':' + value;
  } else {
    target.value = value;
  }
  if (currentKey.length === 1) {
    target.value += currentKey;
  }

  input.value = target.value;

  // fire event
  const ev = mockEvent('change');

  const key = Object.keys(input).find((v) => v.startsWith('__reactProps'));
  input[key].onChange(ev);
};

wow.addEventListener('keyup', function (e) {
  if (e.target.value === 'from:') {
    isFromEnabled = true;
    tag.style.display = 'block';
    tag.style.backgroundColor = getThemeColor();

    update(e.target.value.replace(/from:/, ''), e.key);
  }
});

wow.addEventListener('keydown', function (e) {
  if (e.key === 'Backspace') {
    if (isFromEnabled && e.target.value.length === 0) {
      isFromEnabled = false;
      tag.style.display = 'none';
    }
  }
  if (e.key === 'Enter' && isAutoCompleteSelected) {
    e.stopImmediatePropagation();
    console.log(suggestions[suggestionIndex - 1]);
    suggestions[suggestionIndex - 1].children[0].children[0].click();
  }
  if (e.key === 'ArrowUp') {
    if (isFromEnabled) {
      e.preventDefault();
      if (suggestionIndex === 1) {
        suggestionIndex = suggestions.length - 1;
      } else {
        suggestionIndex--;
      }
      if (!!usernames[suggestionIndex - 1]) {
        wow.value = usernames[suggestionIndex - 1];
        suggestions.forEach((el) => blurSuggestion(el));
        focusSuggestion(suggestions[suggestionIndex - 1]);
        isAutoCompleteSelected = true;
      }
    }
    return;
  }
  if (e.key === 'ArrowDown') {
    if (isFromEnabled) {
      e.preventDefault();
      if (suggestionIndex === suggestions.length) {
        suggestionIndex = 1;
      } else {
        suggestionIndex++;
      }
      if (!!usernames[suggestionIndex - 1]) {
        wow.value = usernames[suggestionIndex - 1];
        // focusSuggestion(suggestions[suggestionIndex]);
        suggestions.forEach((el) => blurSuggestion(el));
        focusSuggestion(suggestions[suggestionIndex - 1]);
        isAutoCompleteSelected = true;
      }
      // focusSuggestion(suggestions[suggestionIndex]);
    }
    return;
  }
  if (e.target.value === 'from:') {
    isFromEnabled = true;
    tag.style.display = 'block';
    tag.style.backgroundColor = getThemeColor();

    update(e.target.value.replace(/from:/, ''), e.key);
  } else {
    update(e.target.value, e.key);
  }
});

const clickSuggestion = (element) => {
  const ev = mockEvent('click');
  const key = Object.keys(input).find((v) => v.startsWith('__reactProps'));

  const focusable = element.children?.[0];
  if (focusable) {
    focusable[key].onClick(ev);
  }
};
const focusSuggestion = (element) => {
  const ev = mockEvent('change');
  const key = Object.keys(input).find((v) => v.startsWith('__reactProps'));

  const focusable = element.children?.[0];
  if (focusable) {
    focusable.style.backgroundColor = getSelectedColor();
    focusable[key].onFocus(ev);
    focusable.querySelector('div[dir="ltr"]').style.color = getThemeColor();
  }
};
const blurSuggestion = (element) => {
  const ev = mockEvent('change');
  const key = Object.keys(input).find((v) => v.startsWith('__reactProps'));

  const focusable = element.children?.[0];
  if (focusable) {
    focusable.style.backgroundColor = 'transparent';
    focusable[key].onBlur(ev);
    focusable.querySelector('div[dir="ltr"]').style.color = getNeturalColor();
  }
};

let cache = '';
setInterval(function () {
  if (!isFromEnabled) {
    return;
  }
  let listItems = [
    ...(form.querySelector('div[role="listbox"]')?.children || []),
  ];

  const newCache = input.value + listItems.length;
  if (cache === newCache) {
    return;
  }
  cache = newCache;

  [usernames, suggestions] = listItems.reduce(
    ([usernames, suggestions], element) => {
      if (element.attributes['role']?.value === 'progressbar') {
        return [usernames, suggestions];
      }
      let username = element.innerText.match(/@.*\n/)?.[0]?.trim();
      if (!username) {
        if (input.value.length > 0) {
          element.style.display = 'none';
        }
        return [usernames, suggestions];
      }
      return [
        [...usernames, username],
        [...suggestions, element],
      ];
    },
    [[], []],
  );

  if (usernames.length > 0) {
    suggestionIndex = 0;
    isAutoCompleteSelected = false;
  }
}, 100);
