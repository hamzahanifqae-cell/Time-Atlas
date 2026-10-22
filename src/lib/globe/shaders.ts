/**
 * Day/night Earth shader. Blends the day and night textures based on the angle between the
 * surface normal and the direction to the sun (both in the same world-space frame the globe
 * mesh is built in — see src/lib/geo/sphere.ts for the shared lat/lon -> vector convention).
 * `dot(normal, sunDirection)` is the cosine of the sun's elevation at that point: positive
 * means daylight, negative means night, and we soften the line between them (a terminator a
 * few degrees wide) rather than a hard edge, since this is explicitly an approximation, not
 * a precise sunrise/sunset calculation.
 */
export const earthVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    // The globe mesh is never rotated (the camera orbits instead — see GlobeCanvas.tsx), so
    // its object space IS world space, and the raw vertex normal can be compared directly
    // against a world-space sun direction without a normal-matrix transform. Using
    // normalMatrix here would put vNormal in view space, which rotates with the camera and
    // would make the terminator incorrectly swing around as the user drags the globe.
    vNormal = normalize(normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const earthFragmentShader = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform vec3 sunDirection;

  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vec3 dayColor = texture2D(dayMap, vUv).rgb;
    vec3 nightColor = texture2D(nightMap, vUv).rgb * 1.65 + vec3(0.012, 0.022, 0.042);

    float cosAngle = dot(normalize(vNormal), normalize(sunDirection));
    // Soft terminator band roughly +/-6 degrees wide.
    float mixFactor = smoothstep(-0.1, 0.1, cosAngle);

    vec3 color = mix(nightColor, dayColor * 1.08, mixFactor);
    float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(cameraPosition))), 3.5);
    color += vec3(0.04, 0.20, 0.32) * rim * 0.4;
    gl_FragColor = vec4(color, 1.0);
  }
`;
