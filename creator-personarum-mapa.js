/*
 * Creator Personarum — mapa interactivo del mundo.
 *
 * Sitio estático (GitHub Pages): sin servidor ni API. Lee window.CREATOR_ATLAS (creator-personarum-atlas.js)
 * y dibuja áreas y marcadores transparentes en un SVG alineado con la imagen del mapa (mismo viewBox que la
 * imagen, así que sigue alineado en cualquier resolución con la misma proporción).
 *
 * Este módulo no guarda nada: avisa al programa principal (creator-personarum.js) con onOriginChange.
 */
(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const ZOOM_LEVELS = [1, 1.5, 2, 3];
  const MAX_COMPARE = 3;
  const KIND_LABELS = {
    continente: 'Continente',
    reino: 'Reino',
    salvaje: 'Zona salvaje',
    archipielago: 'Archipiélago'
  };
  const GROUPS = [
    { key: 'Tomun', title: 'Continente de Tomun' },
    { key: 'Rala', title: 'Continente de Rala' },
    { key: 'Abigur', title: 'Continente de Abigur' },
    { key: 'Océano', title: 'Archipiélagos del océano' }
  ];

  function el(tag, props, text) {
    const node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(key => {
        if (key === 'class') node.className = props[key];
        else if (key === 'dataset') Object.keys(props.dataset).forEach(k => { node.dataset[k] = props.dataset[k]; });
        else node.setAttribute(key, props[key]);
      });
    }
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function svgEl(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(key => node.setAttribute(key, attrs[key]));
    return node;
  }

  function kindLabel(t) {
    if (t.tipo === 'reino' || t.tipo === 'salvaje') {
      return KIND_LABELS[t.tipo] + ' · ' + t.continente;
    }
    return KIND_LABELS[t.tipo] || '';
  }

  function precisionNote(t) {
    const g = t.geometria;
    if (g.tipo === 'poligono') {
      return 'Área marcada sobre el contorno dibujado en el mapa.';
    }
    if (g.precision === 'aproximada') {
      return 'Ubicación aproximada: el mapa ilustrado no indica con precisión dónde queda este lugar.';
    }
    return 'El mapa no dibuja las fronteras de este territorio: el punto señala su posición.';
  }

  function init(options) {
    const atlas = options.atlas;
    const root = options.root;
    if (!atlas || !Array.isArray(atlas.territorios) || !root) return null;

    const svg = root.querySelector('#creator-map-svg');
    const canvas = root.querySelector('#creator-map-canvas');
    const viewport = root.querySelector('#creator-map-viewport');
    const mapImage = root.querySelector('#creator-map-image');
    const tooltip = root.querySelector('#creator-map-tooltip');
    const panel = root.querySelector('#creator-atlas-panel');
    const panelEmpty = root.querySelector('#creator-atlas-empty');
    const panelContent = root.querySelector('#creator-atlas-content');
    const listBody = root.querySelector('#creator-map-list-body');
    const compareSection = root.querySelector('#creator-compare');
    const compareScroll = root.querySelector('#creator-compare-scroll');
    const liveStatus = root.querySelector('#creator-map-status');
    const zoomIn = root.querySelector('#creator-map-zoom-in');
    const zoomOut = root.querySelector('#creator-map-zoom-out');
    const zoomReset = root.querySelector('#creator-map-zoom-reset');

    const byId = {};
    atlas.territorios.forEach(t => { byId[t.id] = t; });

    const placeNodes = {};
    const listButtons = {};
    let activeId = null;
    let zoomIndex = 0;
    let compareIds = [];
    let lastFocused = null;

    const map = atlas.mapa || {};
    if (mapImage && map.imagen) mapImage.setAttribute('src', map.imagen);
    if (svg && map.ancho && map.alto) svg.setAttribute('viewBox', '0 0 ' + map.ancho + ' ' + map.alto);

    function originId() {
      return typeof options.getOriginId === 'function' ? options.getOriginId() : '';
    }

    function announce(message) {
      if (liveStatus) liveStatus.textContent = message;
    }

    // ------------------------------------------------------------------ mapa
    function polygonPoints(flat) {
      const out = [];
      for (let i = 0; i + 1 < flat.length; i += 2) out.push(flat[i] + ',' + flat[i + 1]);
      return out.join(' ');
    }

    function placeLabel(t) {
      return t.geometria.tipo === 'poligono'
        ? 'Abrir la ficha de ' + t.corto + ' en el Atlas (' + kindLabel(t) + ')'
        : 'Abrir la ficha de ' + t.corto + ' en el Atlas (' + kindLabel(t) + '), ubicación en el mapa';
    }

    function buildMap() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const polygons = atlas.territorios.filter(t => t.geometria.tipo === 'poligono');
      // Las áreas más grandes primero, para que las pequeñas (por ejemplo el Gran Bosque) queden encima.
      polygons.sort((a, b) => b.geometria.puntos.length - a.geometria.puntos.length);
      const markers = atlas.territorios.filter(t => t.geometria.tipo === 'marcador');

      polygons.forEach(t => {
        const group = svgEl('g', {
          class: 'creator-map-place creator-map-place--area',
          tabindex: '0',
          role: 'button',
          'aria-label': placeLabel(t),
          'data-territory': t.id
        });
        group.appendChild(svgEl('polygon', { class: 'creator-map-area', points: polygonPoints(t.geometria.puntos) }));
        svg.appendChild(group);
        placeNodes[t.id] = group;
      });

      markers.forEach(t => {
        const g = t.geometria;
        const approx = g.precision === 'aproximada';
        const group = svgEl('g', {
          class: 'creator-map-place creator-map-place--marker' + (approx ? ' creator-map-place--approx' : ''),
          tabindex: '0',
          role: 'button',
          'aria-label': placeLabel(t),
          'data-territory': t.id,
          transform: 'translate(' + g.x + ' ' + g.y + ')'
        });
        group.appendChild(svgEl('circle', { class: 'creator-map-hit', r: '16' }));
        group.appendChild(svgEl('circle', { class: 'creator-map-origin-ring', r: '12' }));
        group.appendChild(svgEl('circle', { class: 'creator-map-ring', r: '9' }));
        group.appendChild(svgEl('circle', { class: 'creator-map-dot', r: '4.5' }));
        svg.appendChild(group);
        placeNodes[t.id] = group;
      });
    }

    function placeAnchor(t) {
      const g = t.geometria;
      return g.tipo === 'poligono' ? { x: g.centro[0], y: g.centro[1] } : { x: g.x, y: g.y };
    }

    function showTooltip(id) {
      const t = byId[id];
      if (!t || !tooltip || !canvas) return;
      tooltip.textContent = t.corto + ' · ' + kindLabel(t);
      tooltip.hidden = false;
      const anchor = placeAnchor(t);
      tooltip.style.left = (anchor.x / (map.ancho || 1024) * 100) + '%';
      tooltip.style.top = (anchor.y / (map.alto || 765) * 100) + '%';
    }

    function hideTooltip() {
      if (tooltip) tooltip.hidden = true;
    }

    function placeIdFrom(target) {
      let node = target;
      while (node && node !== svg) {
        if (node.getAttribute && node.getAttribute('data-territory')) return node.getAttribute('data-territory');
        node = node.parentNode;
      }
      return '';
    }

    // ------------------------------------------------------------------ lista de lugares
    function buildList() {
      listBody.textContent = '';
      GROUPS.forEach(group => {
        const items = atlas.territorios.filter(t => {
          if (t.tipo === 'continente') return false;
          return t.continente === group.key;
        });
        if (group.key === 'Tomun' || group.key === 'Rala') {
          const continent = atlas.territorios.find(t => t.id === group.key.toLowerCase());
          if (continent) items.unshift(continent);
        }
        if (!items.length) return;
        const section = el('section', { class: 'creator-map-list-group' });
        section.appendChild(el('h3', null, group.title));
        const ul = el('ul');
        items.forEach(t => {
          const li = el('li');
          const button = el('button', { type: 'button', class: 'creator-map-list-item', dataset: { territory: t.id } });
          button.appendChild(el('span', { class: 'creator-map-list-name' }, t.tipo === 'continente' ? 'Todo ' + t.corto : t.corto));
          button.appendChild(el('span', { class: 'creator-map-list-kind' }, t.tipo === 'continente' ? 'Continente' : KIND_LABELS[t.tipo]));
          button.appendChild(el('span', { class: 'creator-map-list-flag', 'aria-hidden': 'true' }, ''));
          li.appendChild(button);
          ul.appendChild(li);
          listButtons[t.id] = button;
        });
        section.appendChild(ul);
        listBody.appendChild(section);
      });
    }

    // ------------------------------------------------------------------ ficha del Atlas
    function section(title) {
      const wrapper = el('section', { class: 'creator-atlas-section' });
      wrapper.appendChild(el('h3', null, title));
      return wrapper;
    }

    function renderPanel(t) {
      panelContent.textContent = '';
      const isOrigin = originId() === t.id;
      const inCompare = compareIds.indexOf(t.id) !== -1;

      const header = el('header', { class: 'creator-atlas-header' });
      const titles = el('div');
      titles.appendChild(el('p', { class: 'creator-eyebrow' }, kindLabel(t).toUpperCase()));
      const title = el('h2', { id: 'creator-atlas-title', tabindex: '-1' }, t.nombre);
      titles.appendChild(title);
      header.appendChild(titles);
      header.appendChild(el('button', { type: 'button', class: 'creator-atlas-close', 'aria-label': 'Cerrar la ficha y volver al mapa', 'data-action': 'close' }, '×'));
      panelContent.appendChild(header);

      const actions = el('div', { class: 'creator-atlas-actions' });
      actions.appendChild(el('button', {
        type: 'button',
        class: 'creator-atlas-origin-button' + (isOrigin ? ' is-chosen' : ''),
        'data-action': 'origin',
        'aria-pressed': isOrigin ? 'true' : 'false'
      }, isOrigin ? '✓ ORIGEN ELEGIDO · QUITAR' : 'ELEGIR COMO ORIGEN'));
      actions.appendChild(el('button', {
        type: 'button',
        class: 'creator-atlas-compare-button' + (inCompare ? ' is-chosen' : ''),
        'data-action': 'compare',
        'aria-pressed': inCompare ? 'true' : 'false'
      }, inCompare ? '✓ EN LA COMPARACIÓN · QUITAR' : 'AÑADIR A LA COMPARACIÓN'));
      panelContent.appendChild(actions);
      panelContent.appendChild(el('p', { class: 'creator-atlas-neutral' }, 'Elegir un origen no impone linaje, clase, religión ni otras decisiones de tu personaje.'));

      if (t.intro) {
        const sec = section('El continente');
        sec.appendChild(el('p', { class: 'creator-atlas-intro' }, t.intro));
        panelContent.appendChild(sec);
      }

      if (t.descripcion && t.descripcion.length) {
        const sec = section(t.tipo === 'continente' ? 'Sobre este continente' : 'Descripción');
        t.descripcion.forEach(text => sec.appendChild(el('p', null, text)));
        panelContent.appendChild(sec);
      }

      if (t.campos && t.campos.length) {
        const dl = el('dl', { class: 'creator-atlas-fields' });
        t.campos.forEach(field => {
          const row = el('div');
          row.appendChild(el('dt', null, field.etiqueta));
          row.appendChild(el('dd', null, field.valor));
          dl.appendChild(row);
        });
        const sec = section('Ficha');
        sec.appendChild(dl);
        panelContent.appendChild(sec);
      }

      if (t.ciudadesEstado && t.ciudadesEstado.length) {
        const sec = section('Ciudades-estado');
        const ul = el('ul', { class: 'creator-atlas-list' });
        t.ciudadesEstado.forEach(c => {
          const li = el('li');
          li.appendChild(el('strong', null, c.nombre));
          li.appendChild(document.createTextNode(': ' + c.gobierno));
          ul.appendChild(li);
        });
        sec.appendChild(ul);
        panelContent.appendChild(sec);
      } else if (t.ciudades && t.ciudades.length) {
        const sec = section(t.tipo === 'archipielago' ? 'Asentamientos' : 'Ciudades y asentamientos');
        const ul = el('ul', { class: 'creator-atlas-list' });
        t.ciudades.forEach((name, index) => {
          const li = el('li');
          li.appendChild(el('strong', null, name));
          const note = t.ciudadesNotas && t.ciudadesNotas[index];
          if (note) li.appendChild(document.createTextNode(': ' + note));
          ul.appendChild(li);
        });
        sec.appendChild(ul);
        panelContent.appendChild(sec);
      }

      if (t.extras && t.extras.length) {
        const sec = section('Más datos del Atlas');
        const ul = el('ul', { class: 'creator-atlas-list' });
        t.extras.forEach(item => {
          const li = el('li');
          li.appendChild(el('strong', null, item.nombre));
          li.appendChild(document.createTextNode(': ' + item.texto));
          ul.appendChild(li);
        });
        sec.appendChild(ul);
        panelContent.appendChild(sec);
      }

      if (t.geografia && t.geografia.length) {
        const sec = section('Geografía cercana');
        const ul = el('ul', { class: 'creator-atlas-list' });
        t.geografia.forEach(item => {
          const li = el('li');
          li.appendChild(el('strong', null, item.nombre));
          li.appendChild(document.createTextNode(': ' + item.texto));
          ul.appendChild(li);
        });
        sec.appendChild(ul);
        panelContent.appendChild(sec);
      }

      if (t.tipo === 'continente') {
        const children = atlas.territorios.filter(x => x.tipo !== 'continente' && x.continente === t.continente);
        if (children.length) {
          const sec = section('Lugares de ' + t.corto);
          const ul = el('ul', { class: 'creator-atlas-places' });
          children.forEach(child => {
            const li = el('li');
            li.appendChild(el('button', { type: 'button', class: 'creator-atlas-place-link', 'data-open': child.id }, child.corto));
            ul.appendChild(li);
          });
          sec.appendChild(ul);
          panelContent.appendChild(sec);
        }
      }

      panelContent.appendChild(el('p', { class: 'creator-atlas-note' }, precisionNote(t)));
      panelContent.appendChild(el('p', { class: 'creator-atlas-source' }, 'Fuente: Atlas del mundo.'));
    }

    function setPanelVisible(visible) {
      panelEmpty.hidden = visible;
      panelContent.hidden = !visible;
    }

    function updateMarks() {
      const origin = originId();
      Object.keys(placeNodes).forEach(id => {
        const node = placeNodes[id];
        toggleClass(node, 'is-active', id === activeId);
        toggleClass(node, 'is-origin', id === origin);
        toggleClass(node, 'is-compared', compareIds.indexOf(id) !== -1);
        node.setAttribute('aria-pressed', id === activeId ? 'true' : 'false');
      });
      Object.keys(listButtons).forEach(id => {
        toggleClass(listButtons[id], 'is-active', id === activeId);
        toggleClass(listButtons[id], 'is-origin', id === origin);
        const flag = listButtons[id].querySelector('.creator-map-list-flag');
        if (flag) flag.textContent = id === origin ? '✓ ORIGEN' : (compareIds.indexOf(id) !== -1 ? 'COMPARANDO' : '');
      });
    }

    function toggleClass(node, name, on) {
      if (node.classList) {
        if (on) node.classList.add(name); else node.classList.remove(name);
      } else {
        const classes = (node.getAttribute('class') || '').split(/\s+/).filter(Boolean).filter(c => c !== name);
        if (on) classes.push(name);
        node.setAttribute('class', classes.join(' '));
      }
    }

    function openTerritory(id, settings) {
      const t = byId[id];
      if (!t) return;
      const opts = settings || {};
      activeId = id;
      renderPanel(t);
      setPanelVisible(true);
      updateMarks();
      announce('Ficha abierta: ' + t.nombre + '.');
      const title = panelContent.querySelector('#creator-atlas-title');
      if (title && opts.focus !== false) {
        try { title.focus({ preventScroll: true }); } catch (error) { title.focus(); }
      }
      if (opts.scroll !== false && panel.scrollIntoView && window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function closePanel() {
      const id = activeId;
      activeId = null;
      setPanelVisible(false);
      updateMarks();
      announce('Ficha cerrada. Podés elegir otro lugar.');
      const node = id && (placeNodes[id] || listButtons[id]);
      if (node && node.focus) {
        try { node.focus({ preventScroll: true }); } catch (error) { node.focus(); }
      }
      if (viewport && viewport.scrollIntoView && window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
        viewport.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function toggleOrigin(id) {
      const t = byId[id];
      if (!t) return;
      const next = originId() === id ? '' : id;
      if (typeof options.onOriginChange === 'function') options.onOriginChange(next);
      announce(next ? 'Origen elegido: ' + t.nombre + '.' : 'Origen quitado.');
      refresh();
    }

    function toggleCompare(id) {
      const t = byId[id];
      if (!t) return;
      const index = compareIds.indexOf(id);
      if (index !== -1) {
        compareIds.splice(index, 1);
        announce(t.corto + ' salió de la comparación.');
      } else if (compareIds.length >= MAX_COMPARE) {
        announce('La comparación admite hasta ' + MAX_COMPARE + ' lugares. Quitá uno para añadir otro.');
        return;
      } else {
        compareIds.push(id);
        announce(t.corto + ' se añadió a la comparación (' + compareIds.length + ' de ' + MAX_COMPARE + ').');
      }
      refresh();
    }

    // ------------------------------------------------------------------ comparación
    function compareRows() {
      return [
        ['Tipo', t => kindLabel(t)],
        ['Capital', t => fieldValue(t, 'Capital')],
        ['Gobierno', t => fieldValue(t, 'Gobierno')],
        ['Pueblos', t => fieldValue(t, 'Pueblos')],
        ['Religiones', t => fieldValue(t, 'Religiones')],
        ['Ubicación', t => fieldValue(t, 'Ubicación')],
        ['Naturaleza', t => fieldValue(t, 'Naturaleza')],
        ['Sociedad', t => fieldValue(t, 'Sociedad')],
        ['Ciudades', t => (t.ciudades || []).join(', ')]
      ];
    }

    function fieldValue(t, label) {
      const field = (t.campos || []).find(f => f.etiqueta === label);
      return field ? field.valor : '';
    }

    function renderCompare() {
      compareScroll.textContent = '';
      compareSection.hidden = compareIds.length === 0;
      if (!compareIds.length) return;
      const places = compareIds.map(id => byId[id]);
      const table = el('table', { class: 'creator-compare-table' });
      table.appendChild(el('caption', { class: 'creator-map-sr' }, 'Comparación de lugares del Atlas'));
      const thead = el('thead');
      const headRow = el('tr');
      headRow.appendChild(el('th', { scope: 'col' }, ''));
      places.forEach(t => {
        const th = el('th', { scope: 'col' });
        th.appendChild(el('span', { class: 'creator-compare-name' }, t.corto));
        const open = el('button', { type: 'button', class: 'creator-compare-link', 'data-open': t.id }, 'VER FICHA');
        const choose = el('button', {
          type: 'button',
          class: 'creator-compare-origin' + (originId() === t.id ? ' is-chosen' : ''),
          'data-origin': t.id
        }, originId() === t.id ? '✓ ORIGEN ELEGIDO' : 'ELEGIR COMO ORIGEN');
        const remove = el('button', { type: 'button', class: 'creator-compare-remove', 'data-compare-remove': t.id }, 'QUITAR');
        th.appendChild(open); th.appendChild(choose); th.appendChild(remove);
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);
      const tbody = el('tbody');
      compareRows().forEach(row => {
        const values = places.map(row[1]);
        if (!values.some(Boolean)) return;
        const tr = el('tr');
        tr.appendChild(el('th', { scope: 'row' }, row[0]));
        values.forEach(value => tr.appendChild(el('td', null, value || '—')));
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      compareScroll.appendChild(table);
    }

    function refresh() {
      if (activeId && byId[activeId]) {
        const hadFocus = panelContent.querySelector && document.activeElement && panelContent.contains && panelContent.contains(document.activeElement);
        const action = hadFocus && document.activeElement.getAttribute ? document.activeElement.getAttribute('data-action') : '';
        renderPanel(byId[activeId]);
        if (action) {
          const again = panelContent.querySelector('[data-action="' + action + '"]');
          if (again && again.focus) again.focus();
        }
      }
      updateMarks();
      renderCompare();
    }

    // ------------------------------------------------------------------ zoom
    function applyZoom() {
      canvas.style.width = (ZOOM_LEVELS[zoomIndex] * 100) + '%';
      zoomIn.disabled = zoomIndex >= ZOOM_LEVELS.length - 1;
      zoomOut.disabled = zoomIndex <= 0;
    }

    function setZoom(index) {
      zoomIndex = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, index));
      applyZoom();
      announce('Zoom del mapa: ×' + ZOOM_LEVELS[zoomIndex] + '.');
    }

    // ------------------------------------------------------------------ modo calibración (?calibrar=1)
    function setupCalibration() {
      const params = window.location && window.location.search ? window.location.search : '';
      if (!/[?&]calibrar(=|&|$)/.test(params)) return;
      const box = el('div', { class: 'creator-map-calibration', role: 'status' });
      box.appendChild(el('strong', null, 'MODO CALIBRACIÓN'));
      const readout = el('p', { id: 'creator-map-calibration-readout' }, 'Tocá el mapa para leer coordenadas (x, y) en el sistema de la imagen.');
      const toggle = el('label');
      const checkbox = el('input', { type: 'checkbox', id: 'creator-map-calibration-reference' });
      toggle.appendChild(checkbox);
      toggle.appendChild(document.createTextNode(' Mostrar el mapa rotulado de referencia'));
      box.appendChild(readout); box.appendChild(toggle);
      viewport.parentNode.insertBefore(box, viewport.nextSibling);
      checkbox.addEventListener('change', () => {
        mapImage.setAttribute('src', checkbox.checked && map.referencia ? map.referencia : map.imagen);
      });
      canvas.addEventListener('click', event => {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = Math.round((event.clientX - rect.left) / rect.width * (map.ancho || 1024));
        const y = Math.round((event.clientY - rect.top) / rect.height * (map.alto || 765));
        readout.textContent = 'x = ' + x + ', y = ' + y + '  (copiá estos valores en herramientas/zonas-mapa.json)';
      });
    }

    // ------------------------------------------------------------------ eventos
    svg.addEventListener('click', event => {
      const id = placeIdFrom(event.target);
      if (id) openTerritory(id);
    });
    svg.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;
      const id = placeIdFrom(event.target);
      if (!id) return;
      event.preventDefault();
      openTerritory(id);
    });
    svg.addEventListener('mouseover', event => {
      const id = placeIdFrom(event.target);
      if (id) showTooltip(id); else hideTooltip();
    });
    svg.addEventListener('mouseleave', hideTooltip);
    svg.addEventListener('focusin', event => {
      const id = placeIdFrom(event.target);
      if (id) showTooltip(id);
    });
    svg.addEventListener('focusout', hideTooltip);

    listBody.addEventListener('click', event => {
      let node = event.target;
      while (node && node !== listBody && !(node.getAttribute && node.getAttribute('data-territory'))) node = node.parentNode;
      if (node && node !== listBody) openTerritory(node.getAttribute('data-territory'));
    });

    panelContent.addEventListener('click', event => {
      let node = event.target;
      while (node && node !== panelContent && !(node.getAttribute && (node.getAttribute('data-action') || node.getAttribute('data-open')))) node = node.parentNode;
      if (!node || node === panelContent) return;
      const action = node.getAttribute('data-action');
      if (action === 'close') closePanel();
      else if (action === 'origin') toggleOrigin(activeId);
      else if (action === 'compare') toggleCompare(activeId);
      else if (node.getAttribute('data-open')) openTerritory(node.getAttribute('data-open'));
    });

    compareScroll.addEventListener('click', event => {
      let node = event.target;
      while (node && node !== compareScroll && !(node.getAttribute && (node.getAttribute('data-open') || node.getAttribute('data-origin') || node.getAttribute('data-compare-remove')))) node = node.parentNode;
      if (!node || node === compareScroll) return;
      if (node.getAttribute('data-open')) openTerritory(node.getAttribute('data-open'));
      else if (node.getAttribute('data-origin')) toggleOrigin(node.getAttribute('data-origin'));
      else if (node.getAttribute('data-compare-remove')) toggleCompare(node.getAttribute('data-compare-remove'));
    });

    panel.addEventListener('keydown', event => {
      if (event.key === 'Escape' && activeId) closePanel();
    });

    zoomIn.addEventListener('click', () => setZoom(zoomIndex + 1));
    zoomOut.addEventListener('click', () => setZoom(zoomIndex - 1));
    zoomReset.addEventListener('click', () => setZoom(0));

    buildMap();
    buildList();
    setPanelVisible(false);
    applyZoom();
    updateMarks();
    renderCompare();
    setupCalibration();

    return {
      open: openTerritory,
      close: closePanel,
      refresh,
      getTerritory: id => byId[id] || null,
      getActiveId: () => activeId,
      getCompareIds: () => compareIds.slice(),
      getZoom: () => ZOOM_LEVELS[zoomIndex]
    };
  }

  window.CreatorPersonarumMapa = { init: init };
})();
