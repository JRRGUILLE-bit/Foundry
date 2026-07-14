(() => {
  "use strict";

  const correctedD10 = `  function makePentagonalTrapezohedron() {
    const sides = 5;
    const ringRadius = 1;
    const ringHeight = 0.3;
    const apexHeight = 1.32;
    const vertices = [
      [0, 0, apexHeight],
      [0, 0, -apexHeight]
    ];
    const faces = [];

    for (let i = 0; i < sides; i += 1) {
      const upperAngle = (Math.PI * 2 * i) / sides;
      const lowerAngle = upperAngle + Math.PI / sides;

      vertices.push([
        Math.cos(upperAngle) * ringRadius,
        Math.sin(upperAngle) * ringRadius,
        ringHeight
      ]);
      vertices.push([
        Math.cos(lowerAngle) * ringRadius,
        Math.sin(lowerAngle) * ringRadius,
        -ringHeight
      ]);
    }

    for (let i = 0; i < sides; i += 1) {
      const previous = (i + sides - 1) % sides;
      const next = (i + 1) % sides;
      const upper = 2 + i * 2;
      const lower = upper + 1;
      const previousLower = 2 + previous * 2 + 1;
      const nextUpper = 2 + next * 2;

      faces.push([0, previousLower, upper, lower]);
      faces.push([1, nextUpper, lower, upper]);
    }

    return { vertices: normalizeShape(vertices), faces };
  }

`;

  fetch("script.js", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`No se pudo cargar script.js: ${response.status}`);
      return response.text();
    })
    .then((source) => {
      const start = source.indexOf("  function makePentagonalTrapezohedron() {");
      const end = source.indexOf("  function makeIcosahedron() {", start);

      if (start < 0 || end < 0) {
        throw new Error("No se encontró la función del d10 para reemplazar.");
      }

      const patchedSource = source.slice(0, start) + correctedD10 + source.slice(end);
      new Function(`${patchedSource}\n//# sourceURL=script-patched.js`)();
    })
    .catch((error) => {
      console.error(error);
      const fallback = document.createElement("script");
      fallback.src = "script.js";
      document.body.appendChild(fallback);
    });
})();
