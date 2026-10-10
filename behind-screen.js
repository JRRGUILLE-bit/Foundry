(() => {
  "use strict";

  const STORAGE_KEY = "banda.behind-screen.local-url.v1";
  const locale = window.FoundryI18n?.locale || "en";
  const copy = locale === "es" ? {
    trigger: "BEHIND THE SCREEN",
    tag: "PARA GUILLE",
    triggerAria: "Para Guille: abrir Foundry local",
    settingsAria: "Configurar dirección local de Foundry",
    kicker: "ACCESO PRIVADO // SOLO ESTE NAVEGADOR",
    title: "BEHIND THE SCREEN",
    description: "Guardá la dirección local de Foundry. Queda guardada solamente en este navegador; no se publica en la web ni en GitHub.",
    addressLabel: "URL local de Foundry",
    placeholder: "http://192.168.1.50:30000",
    hint: "Ingresá la IP de la Asus con Mint y el puerto de Foundry (normalmente 30000). Funciona cuando estás conectado a la misma red.",
    save: "GUARDAR Y ENTRAR",
    cancel: "CANCELAR",
    clear: "BORRAR DIRECCIÓN",
    firstUse: "Configurá la dirección una vez. Después, este botón te lleva directamente a Foundry.",
    saved: "Dirección guardada solo en este navegador.",
    cleared: "Dirección local borrada.",
    invalid: "Ingresá una URL válida que empiece con http:// o https://, sin usuario ni contraseña.",
    storageError: "El navegador no permitió guardar la dirección. Revisá la configuración de privacidad.",
    localLink: "ABRIR DIRECCIÓN GUARDADA"
  } : {
    trigger: "BEHIND THE SCREEN",
    tag: "FOR GUILLE",
    triggerAria: "For Guille: open local Foundry",
    settingsAria: "Configure local Foundry address",
    kicker: "PRIVATE ACCESS // THIS BROWSER ONLY",
    title: "BEHIND THE SCREEN",
    description: "Save your local Foundry address. It stays in this browser only; it is not published to the website or GitHub.",
    addressLabel: "Local Foundry URL",
    placeholder: "http://192.168.1.50:30000",
    hint: "Enter the Mint laptop's LAN IP and Foundry port (usually 30000). This works while connected to the same network.",
    save: "SAVE & ENTER",
    cancel: "CANCEL",
    clear: "CLEAR ADDRESS",
    firstUse: "Set the address once. After that, this button takes you straight to Foundry.",
    saved: "Address saved in this browser only.",
    cleared: "Local address cleared.",
    invalid: "Enter a valid URL starting with http:// or https://, without a username or password.",
    storageError: "The browser could not save the address. Check its privacy settings.",
    localLink: "OPEN SAVED ADDRESS"
  };

  function normalizeHttpUrl(value) {
    try {
      const url = new URL(value);
      if (
        (url.protocol !== "http:" && url.protocol !== "https:") ||
        !url.hostname ||
        url.username ||
        url.password
      ) {
        return "";
      }
      return url.href;
    } catch {
      return "";
    }
  }

  function getSavedUrl() {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return value ? normalizeHttpUrl(value) : "";
    } catch {
      return "";
    }
  }

  const dock = document.createElement("nav");
  dock.className = "behind-screen-dock";
  dock.setAttribute("aria-label", copy.triggerAria);
  dock.innerHTML =
    '<button class="behind-screen-trigger" id="behind-screen-trigger" type="button">' +
      '<span class="behind-screen-trigger__prefix" aria-hidden="true">[GM]</span>' +
      '<span class="behind-screen-trigger__copy">' +
        '<span class="behind-screen-trigger__title"></span>' +
        '<span class="behind-screen-trigger__tag"></span>' +
      '</span>' +
    '</button>' +
    '<button class="behind-screen-settings" id="behind-screen-settings" type="button"></button>';

  dock.querySelector(".behind-screen-trigger__title").textContent = copy.trigger;
  dock.querySelector(".behind-screen-trigger__tag").textContent = copy.tag;
  dock.querySelector("#behind-screen-trigger").setAttribute("aria-label", copy.triggerAria);
  dock.querySelector("#behind-screen-settings").setAttribute("aria-label", copy.settingsAria);
  dock.querySelector("#behind-screen-settings").textContent = "⚙";

  const dialog = document.createElement("dialog");
  dialog.className = "behind-screen-dialog";
  dialog.id = "behind-screen-dialog";
  dialog.setAttribute("aria-labelledby", "behind-screen-dialog-title");
  dialog.innerHTML =
    '<form class="behind-screen-dialog__panel" id="behind-screen-form" novalidate>' +
      '<p class="behind-screen-dialog__kicker"></p>' +
      '<h2 id="behind-screen-dialog-title"></h2>' +
      '<p class="behind-screen-dialog__description"></p>' +
      '<label class="behind-screen-dialog__label" for="behind-screen-address"></label>' +
      '<input class="behind-screen-dialog__input" id="behind-screen-address" name="address" type="url" ' +
        'inputmode="url" autocomplete="url" spellcheck="false" placeholder="" required>' +
      '<p class="behind-screen-dialog__hint"></p>' +
      '<p class="behind-screen-dialog__status" id="behind-screen-status" aria-live="polite"></p>' +
      '<a class="behind-screen-dialog__saved-link" id="behind-screen-saved-link" hidden></a>' +
      '<div class="behind-screen-dialog__actions">' +
        '<button class="behind-screen-dialog__clear" id="behind-screen-clear" type="button"></button>' +
        '<div class="behind-screen-dialog__actions-primary">' +
          '<button class="behind-screen-dialog__cancel" id="behind-screen-cancel" type="button"></button>' +
          '<button class="behind-screen-dialog__save" type="submit"></button>' +
        '</div>' +
      '</div>' +
    '</form>';

  dialog.querySelector(".behind-screen-dialog__kicker").textContent = copy.kicker;
  dialog.querySelector("#behind-screen-dialog-title").textContent = copy.title;
  dialog.querySelector(".behind-screen-dialog__description").textContent = copy.description;
  dialog.querySelector(".behind-screen-dialog__label").textContent = copy.addressLabel;
  dialog.querySelector("#behind-screen-address").placeholder = copy.placeholder;
  dialog.querySelector(".behind-screen-dialog__hint").textContent = copy.hint;
  dialog.querySelector("#behind-screen-clear").textContent = copy.clear;
  dialog.querySelector("#behind-screen-cancel").textContent = copy.cancel;
  dialog.querySelector(".behind-screen-dialog__save").textContent = copy.save;

  const trigger = dock.querySelector("#behind-screen-trigger");
  const settingsButton = dock.querySelector("#behind-screen-settings");
  const addressInput = dialog.querySelector("#behind-screen-address");
  const status = dialog.querySelector("#behind-screen-status");
  const savedLink = dialog.querySelector("#behind-screen-saved-link");
  const clearButton = dialog.querySelector("#behind-screen-clear");

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.dataset.state = isError ? "error" : "info";
  }

  function refreshSavedLink() {
    const savedUrl = getSavedUrl();
    savedLink.hidden = !savedUrl;
    if (savedUrl) {
      savedLink.href = savedUrl;
      savedLink.target = "_self";
      savedLink.rel = "noopener noreferrer";
      savedLink.textContent = copy.localLink;
    } else {
      savedLink.removeAttribute("href");
      savedLink.textContent = "";
    }
    clearButton.hidden = !savedUrl;
  }

  function openSettings() {
    addressInput.value = getSavedUrl();
    setStatus(addressInput.value ? copy.saved : copy.firstUse);
    refreshSavedLink();
    if (!dialog.open) dialog.showModal();
    addressInput.focus();
  }

  function goToSavedAddress() {
    window.location.assign("http://192.168.86.35:30000/game");
  }

  trigger.addEventListener("click", goToSavedAddress);
  settingsButton.addEventListener("click", openSettings);

  dialog.querySelector("#behind-screen-cancel").addEventListener("click", () => {
    dialog.close();
  });

  clearButton.addEventListener("click", () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      addressInput.value = "";
      refreshSavedLink();
      setStatus(copy.cleared);
      addressInput.focus();
    } catch {
      setStatus(copy.storageError, true);
    }
  });

  dialog.querySelector("#behind-screen-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const url = normalizeHttpUrl(addressInput.value.trim());

    if (!url) {
      setStatus(copy.invalid, true);
      addressInput.focus();
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, url);
    } catch {
      setStatus(copy.storageError, true);
      return;
    }

    refreshSavedLink();
    window.location.assign(url);
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  document.body.append(dock, dialog);
})();