// shaders/sky_background.frag
#version 330

in vec2 fragTexCoord;
out vec4 outputColor;

uniform float u_time;
uniform vec2  u_resolution;
uniform vec3  u_cameraDir;

// ============================================================================
// PALETTE & TUNING (PITCH BLACK & PURPLE NEBULA WISPS)
// ============================================================================

const vec3 COLOR_VOID            = vec3(0.000, 0.000, 0.000);
const vec3 COLOR_PURPLE_DEEP     = vec3(0.120, 0.010, 0.280);
const vec3 COLOR_VIOLET_WISP     = vec3(0.380, 0.080, 0.650);
const vec3 COLOR_PURPLE_BRIGHT   = vec3(0.650, 0.250, 0.950);

const float NEBULA_SCALE         = 1.60;
const float NEBULA_BRIGHTNESS    = 0.85;

// ============================================================================
// NOISE UTILITIES
// ============================================================================

float hash31(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
}

vec3 hash33(vec3 p) {
    p = vec3(
        dot(p, vec3(127.1, 311.7, 74.7)),
        dot(p, vec3(269.5, 183.3, 246.1)),
        dot(p, vec3(113.5, 271.9, 124.6))
    );
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float gradNoise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    return mix(
        mix(
            mix(dot(hash33(i + vec3(0,0,0)), f - vec3(0,0,0)),
                dot(hash33(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
            mix(dot(hash33(i + vec3(0,1,0)), f - vec3(0,1,0)),
                dot(hash33(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
        mix(
            mix(dot(hash33(i + vec3(0,0,1)), f - vec3(0,0,1)),
                dot(hash33(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
            mix(dot(hash33(i + vec3(0,1,1)), f - vec3(0,1,1)),
                dot(hash33(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z
    );
}

float fbm(vec3 p) {
    float total = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; ++i) {
        total += gradNoise3D(p) * amp;
        p = p * 2.03 + vec3(14.1, 3.2, 7.7);
        amp *= 0.5;
    }
    return total * 0.5 + 0.5;
}

// ============================================================================
// PURPLE NEBULA WISPS
// ============================================================================

vec3 renderPurpleNebula(vec3 rayDir) {
    vec3 p = rayDir * NEBULA_SCALE;

    vec3 q = vec3(
        fbm(p + vec3(0.0, 0.0, 0.0)),
        fbm(p + vec3(5.2, 1.3, 2.8)),
        fbm(p + vec3(1.8, 3.4, 7.1))
    );

    float noiseVal = fbm(p + 1.8 * q);

    // Steep threshold to leave vast areas pure pitch black
    float wisp = pow(smoothstep(0.48, 0.78, noiseVal), 2.2);
    if (wisp <= 0.001) return vec3(0.0);

    vec3 col = mix(COLOR_PURPLE_DEEP, COLOR_VIOLET_WISP, smoothstep(0.0, 0.5, wisp));
    col = mix(col, COLOR_PURPLE_BRIGHT, pow(wisp, 2.0));

    return col * wisp * NEBULA_BRIGHTNESS;
}

// ============================================================================
// UN-CROPPED STAR GENERATOR
// ============================================================================

vec3 renderStars(vec3 rayDir) {
    vec3 stars = vec3(0.0);

    // Layer 1: Background pinpoints
    vec3 p1 = rayDir * 180.0;
    vec3 id1 = floor(p1);
    float h1 = hash31(id1);
    if (h1 > 0.972) {
        // Offset padded tightly inside [-0.25, 0.25] to prevent cell border truncation
        vec3 offset = (hash33(id1) * 0.25);
        float d = length((fract(p1) - 0.5) - offset);
        float star = smoothstep(0.12, 0.0, d);
        stars += vec3(star) * (0.65 + 0.35 * sin(u_time * 2.0 + h1 * 6.28));
    }

    // Layer 2: Medium glowing stars
    vec3 p2 = rayDir * 75.0;
    vec3 id2 = floor(p2);
    float h2 = hash31(id2);
    if (h2 > 0.984) {
        vec3 offset = (hash33(id2) * 0.22);
        float d = length((fract(p2) - 0.5) - offset);
        float core = smoothstep(0.15, 0.0, d);
        float halo = exp(-d * 14.0) * 0.45;

        vec3 color = mix(vec3(0.7, 0.85, 1.0), vec3(1.0, 0.95, 0.8), hash31(id2 + 1.0));
        stars += color * (core + halo) * 2.8;
    }

    return stars;
}

// ============================================================================
// GALAXY TYPES ENGINE
// ============================================================================

// 1. Classic Spiral Galaxy (Reference style)
vec3 renderSpiralGalaxy(vec3 rayDir, vec3 centerDir, float radius) {
    vec3 delta = rayDir - centerDir;
    float d = length(delta);
    if (d > radius) return vec3(0.0);

    vec3 u = normalize(cross(centerDir, vec3(0.0, 1.0, 0.0)));
    vec3 v = cross(centerDir, u);
    vec2 uv = vec2(dot(delta, u), dot(delta, v)) / radius;

    float r = length(uv);
    if (r > 1.0) return vec3(0.0);

    float angle = atan(uv.y, uv.x);
    float spiral = sin(angle * 2.0 - log(r + 0.001) * 4.2);
    float arm = pow(max(0.0, spiral), 3.5) * exp(-r * 2.5);

    float core = exp(-r * 7.0) * 3.5;
    float halo = exp(-r * 2.0) * 0.4;

    vec3 coreColor = vec3(1.0, 0.95, 0.85);
    vec3 armColor  = vec3(0.45, 0.65, 1.0);

    float alpha = smoothstep(1.0, 0.3, r);
    return (coreColor * core + armColor * (arm + halo)) * alpha;
}

// 2. Barred Spiral Galaxy
vec3 renderBarredGalaxy(vec3 rayDir, vec3 centerDir, float radius) {
    vec3 delta = rayDir - centerDir;
    float d = length(delta);
    if (d > radius) return vec3(0.0);

    vec3 u = normalize(cross(centerDir, vec3(0.0, 1.0, 0.0)));
    vec3 v = cross(centerDir, u);
    vec2 uv = vec2(dot(delta, u), dot(delta, v)) / radius;

    float r = length(uv);
    if (r > 1.0) return vec3(0.0);

    float bar = exp(-abs(uv.y) * 12.0) * exp(-abs(uv.x) * 2.2);
    float angle = atan(uv.y, uv.x);
    float spiral = sin(angle * 2.0 - log(r + 0.001) * 3.0);
    float arms = pow(max(0.0, spiral), 4.0) * exp(-r * 2.0);
    float core = exp(-r * 8.0) * 3.0;

    vec3 color = mix(vec3(1.0, 0.7, 0.4), vec3(0.4, 0.8, 1.0), r);
    return color * (core + bar * 1.5 + arms) * smoothstep(1.0, 0.2, r);
}

// 3. Elliptical Galaxy
vec3 renderEllipticalGalaxy(vec3 rayDir, vec3 centerDir, float radius) {
    vec3 delta = rayDir - centerDir;
    float d = length(delta);
    if (d > radius) return vec3(0.0);

    vec3 u = normalize(cross(centerDir, vec3(0.0, 1.0, 0.0)));
    vec3 v = cross(centerDir, u);
    vec2 uv = vec2(dot(delta, u), dot(delta, v)) / radius;
    uv.y *= 1.4; // Elliptical distortion

    float r = length(uv);
    if (r > 1.0) return vec3(0.0);

    float profile = exp(-pow(r, 0.75) * 4.5) * 2.2;
    vec3 color = mix(vec3(1.0, 0.8, 0.5), vec3(0.8, 0.4, 0.9), r);

    return color * profile * smoothstep(1.0, 0.1, r);
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

void main() {
    vec3 forward = length(u_cameraDir) < 0.001 ? vec3(0.0, 0.0, -1.0) : normalize(u_cameraDir);
    vec3 worldUp = abs(forward.y) > 0.99 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
    vec3 right   = normalize(cross(forward, worldUp));
    vec3 up      = cross(right, forward);

    vec2 screen = (gl_FragCoord.xy - 0.5 * u_resolution) / max(u_resolution.y, 1.0);
    vec3 rayDir = normalize(forward + screen.x * right + screen.y * up);

    // 1. Pitch Black Space Base
    vec3 color = COLOR_VOID;

    // 2. Multi-Type Galaxies Placed in View (Spiral, Barred, Elliptical)
    color += renderSpiralGalaxy(rayDir, normalize(vec3(0.0, 0.25, -0.95)), 0.24) * 1.8;
    color += renderBarredGalaxy(rayDir, normalize(vec3(-0.70, 0.30, -0.60)), 0.18) * 1.5;
    color += renderEllipticalGalaxy(rayDir, normalize(vec3(0.65, -0.20, -0.70)), 0.16) * 1.4;

    // 3. Purple Nebula Wisps
    color += renderPurpleNebula(rayDir);

    // 4. Smooth Round Stars
    color += renderStars(rayDir);

    // Tone Map & Final Clamp
    color = vec3(1.0) - exp(-color * 1.2);
    outputColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}